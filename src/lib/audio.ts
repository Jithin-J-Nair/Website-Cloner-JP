"use client";

import { crossesFracture, IDLE_JOURNEY, journeyMix, STEM_NAMES, type JourneyAudioInput, type JourneyMix } from "./journey-audio-state";
import { createFracture, createScore } from "./journey-score";

type AudioStatus = "off" | "starting" | "on" | "suspended" | "unavailable";
type Ramp = { from: number; to: number; start: number; end: number };
const defaultContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Constructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Constructor ? new Constructor() : null;
};

/** One document-level audio owner. No fetches, proprietary samples or audio RAF.
 * Scene update() only hands off the latest coordinates; graph/automation runs in
 * a coalesced microtask outside the render call. All music AND UI/SFX use master.
 */
export class JourneySoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private effects: GainNode | null = null;
  private stageFilter: BiquadFilterNode | null = null;
  private holdFilter: BiquadFilterNode | null = null;
  private nodes: AudioNode[] = [];
  private stems: { source: AudioBufferSourceNode; gain: GainNode; at: number }[] = [];
  private voices = new Map<AudioScheduledSourceNode, GainNode>();
  private score: ReturnType<typeof createScore> | null = null;
  private fracture: AudioBuffer | null = null;
  private ramps = new WeakMap<AudioParam, Ramp>();
  private requested = false;
  private hidden = false;
  private held = false;
  private overlayPaused = false;
  private status: AudioStatus = "off";
  private error: string | null = null;
  private epoch = 0;
  private owners = 0;
  private owner: symbol | null = null;
  private latest: JourneyAudioInput = { ...IDLE_JOURNEY };
  private previous: JourneyAudioInput | null = null;
  private pending = false;
  private fracturePending = false;
  private mix: JourneyMix = journeyMix(IDLE_JOURNEY);
  private listeners = new Set<() => void>();
  private cleanListeners: (() => void) | null = null;
  private contextCreations = 0;
  private fractureEvents = 0;
  private events: { at: number; type: string; stage: string }[] = [];

  constructor(private readonly makeContext: () => AudioContext | null = defaultContext) {}

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  public getStatus = (): AudioStatus => this.status;
  public isEnabled(): boolean { return this.requested; }
  public snapshot() {
    return { status: this.status, enabled: this.requested, error: this.error, stage: this.mix.stage,
      gains: [...this.mix.gains], cutoff: this.mix.cutoff, held: this.held, hidden: this.hidden,
      paused: this.latest.paused || this.overlayPaused, contextState: this.ctx?.state ?? "not-created",
      contextCreations: this.contextCreations, loops: this.stems.length, voices: this.voices.size,
      fractureEvents: this.fractureEvents, input: { ...this.latest }, events: [...this.events] };
  }
  private notify() { for (const listener of this.listeners) listener(); }
  private record(type: string) {
    this.events.push({ at: this.ctx?.currentTime ?? 0, type, stage: this.mix.stage });
    if (this.events.length > 80) this.events.shift();
  }

  /** HUD lifecycle: listeners are registered once, including interrupted-gesture release.
   * Pointer-down is deliberately NOT bound: reference hold behavior is unverified.
   */
  public attach(): () => void {
    this.owners++;
    if (this.owners === 1 && typeof window !== "undefined") {
      this.hidden = document.visibilityState !== "visible";
      const release = () => this.setHeld(false);
      const visibility = () => {
        this.hidden = document.visibilityState !== "visible";
        release();
        this.fracturePending = false;
        this.safeApply();
        if (this.hidden) { this.stopVoices(); void this.ctx?.suspend().catch(() => {}); }
        else if (this.requested) this.resume(this.epoch);
      };
      const pagehide = () => { this.hidden = true; release(); this.safeApply(); this.stopVoices(); void this.ctx?.suspend().catch(() => {}); };
      document.addEventListener("visibilitychange", visibility);
      window.addEventListener("pageshow", visibility);
      window.addEventListener("pagehide", pagehide);
      for (const name of ["pointerup", "pointercancel", "lostpointercapture", "blur"]) window.addEventListener(name, release);
      this.cleanListeners = () => {
        document.removeEventListener("visibilitychange", visibility);
        window.removeEventListener("pageshow", visibility);
        window.removeEventListener("pagehide", pagehide);
        for (const name of ["pointerup", "pointercancel", "lostpointercapture", "blur"]) window.removeEventListener(name, release);
      };
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--this.owners === 0) {
        this.cleanListeners?.(); this.cleanListeners = null;
        this.setEnabled(false);
        this.stopSources();
        void this.ctx?.suspend().catch(() => {});
      }
    };
  }

  /** A generation-checked scene lease prevents late async/unmount writes from
   * clearing a newly mounted scene. This owns state, NOT a second timeline.
   */
  public acquireJourney() {
    const token = Symbol("goal-audio");
    this.owner = token; this.previous = null;
    return {
      update: (input: JourneyAudioInput) => {
        if (this.owner !== token) return;
        if (crossesFracture(this.previous, input) && this.requested && !this.hidden && !this.overlayPaused && this.ctx?.state === "running") this.fracturePending = true;
        // Never defer a fracture through pause, reverse, mute, fallback or skip.
        if (!input.active || input.paused || (this.previous && input.drop < this.previous.drop) || !input.fractureVisible) this.fracturePending = false;
        this.previous = input; this.latest = input;
        this.schedule();
      },
      release: () => {
        if (this.owner !== token) return;
        this.owner = null; this.previous = null; this.latest = { ...IDLE_JOURNEY };
        this.fracturePending = false; this.setHeld(false); this.schedule();
      },
    };
  }
  private schedule() {
    if (this.pending) return;
    this.pending = true;
    queueMicrotask(() => { this.pending = false; this.safeApply(); });
  }

  /** Cancel/replace, never append a backlog of stage transitions. */
  private ramp(param: AudioParam, to: number, seconds = 0.09, notBefore = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime, old = this.ramps.get(param);
    if (old?.to === to) return;
    const from = old ? old.from + (old.to - old.from) * Math.max(0, Math.min(1, (now - old.start) / Math.max(0.001, old.end - old.start))) : param.value;
    param.cancelScheduledValues(now);
    const start = Math.max(now, notBefore);
    param.setValueAtTime(from, now);
    if (start > now) param.setValueAtTime(from, start);
    param.linearRampToValueAtTime(to, start + seconds);
    this.ramps.set(param, { from, to, start, end: start + seconds });
  }
  private clearGraph() {
    this.stopSources();
    for (const node of this.nodes) node.disconnect();
    this.nodes = [];
    this.master = this.music = this.effects = null;
    this.stageFilter = this.holdFilter = null;
    this.ramps = new WeakMap();
  }
  private graph() {
    if (!this.ctx || this.master) return;
    const ctx = this.ctx, nodes: AudioNode[] = [];
    // Transactional allocation: a failed node factory must remain retryable.
    const keep = <T extends AudioNode>(node: T): T => { nodes.push(node); return node; };
    try {
      const master = keep(ctx.createGain()); master.gain.value = 0;
      const music = keep(ctx.createGain()), effects = keep(ctx.createGain());
      const stage = keep(ctx.createBiquadFilter()); stage.type = "lowpass"; stage.Q.value = 0.55;
      const hold = keep(ctx.createBiquadFilter()); hold.type = "lowpass"; hold.Q.value = 0.65;
      const limiter = keep(ctx.createDynamicsCompressor());
      limiter.threshold.value = -12; limiter.knee.value = 12; limiter.ratio.value = 4;
      limiter.attack.value = 0.004; limiter.release.value = 0.20;
      stage.connect(hold); hold.connect(music); music.connect(master); effects.connect(master);
      master.connect(limiter); limiter.connect(ctx.destination);
      this.master = master; this.music = music; this.effects = effects;
      this.stageFilter = stage; this.holdFilter = hold; this.nodes = nodes;
    } catch (error) { for (const node of nodes) node.disconnect(); throw error; }
  }
  private startSources() {
    if (!this.ctx || !this.stageFilter || this.stems.length) return;
    this.score ??= createScore(this.ctx);
    this.fracture ??= createFracture(this.ctx);
    const at = this.ctx.currentTime + 0.025;
    for (const name of STEM_NAMES) {
      const source = this.ctx.createBufferSource(), gain = this.ctx.createGain();
      this.stems.push({ source, gain, at });
      source.buffer = this.score.get(name)!; source.loop = true; gain.gain.value = 0;
      source.connect(gain); gain.connect(this.stageFilter); source.start(at);
    }
    this.record("sources-started");
  }
  private resume(epoch: number) {
    if (!this.ctx || this.hidden) return;
    // resume() is called synchronously by the sound-button gesture on first use.
    try {
      void this.ctx.resume().then(() => {
        if (epoch !== this.epoch || !this.requested || this.hidden) return;
        this.graph(); this.startSources(); this.status = this.ctx?.state === "running" ? "on" : "suspended";
        this.safeApply(); this.notify();
      }).catch((error: unknown) => this.fail(error, epoch));
    } catch (error) { this.fail(error, epoch); }
  }
  private fail(error: unknown, epoch: number) {
    if (epoch !== this.epoch) return;
    this.error = error instanceof Error ? error.message : "Audio unavailable";
    this.requested = false; this.status = "unavailable";
    if (this.master && this.ctx) { try { this.master.gain.cancelScheduledValues(this.ctx.currentTime); this.master.gain.setValueAtTime(0, this.ctx.currentTime); } catch {} }
    this.ramps = new WeakMap(); this.stopSources(); this.notify();
  }
  public setEnabled(next: boolean): boolean {
    const epoch = ++this.epoch;
    this.fracturePending = false;
    this.requested = next;
    if (!next) {
      this.status = "off"; this.setHeld(false); this.stopVoices(0.02); this.safeApply(); this.notify(); return false;
    }
    try {
      if (!this.ctx || this.ctx.state === "closed") {
        if (this.ctx) { this.ctx.onstatechange = null; this.clearGraph(); }
        this.ctx = this.makeContext();
        if (!this.ctx) throw new Error("Web Audio is unavailable; the visual journey remains available.");
        this.contextCreations++;
        this.ctx.onstatechange = () => {
          if (!this.requested) return;
          this.status = this.ctx?.state === "running" ? "on" : "suspended";
          this.safeApply(); this.notify();
        };
      }
      this.error = null; this.status = "starting"; this.graph();
      this.resume(epoch); this.notify();
      return true;
    } catch (error) { this.fail(error, epoch); return false; }
  }
  private safeApply() {
    try { this.apply(); } catch (error) { this.fail(error, this.epoch); }
  }
  private apply() {
    const mix = journeyMix(this.latest), changed = mix.stage !== this.mix.stage;
    this.mix = mix;
    if (changed) { this.record("stage"); this.notify(); }
    if (!this.ctx || !this.master || !this.music || !this.effects || !this.stageFilter || !this.holdFilter) return;
    const audible = this.requested && !this.hidden && this.ctx.state === "running";
    this.ramp(this.master.gain, audible ? 0.65 : 0, 0.035);
    this.ramp(this.music.gain, this.latest.paused || this.overlayPaused ? 0 : mix.level);
    this.ramp(this.effects.gain, this.latest.paused || this.overlayPaused ? 0 : 0.65);
    this.ramp(this.stageFilter.frequency, Math.round(mix.cutoff));
    this.ramp(this.holdFilter.frequency, this.held ? 650 : 11000, 0.12);
    this.stems.forEach((stem, i) => this.ramp(stem.gain.gain, Math.round(mix.gains[i] * 100) / 100, 0.09, stem.at));
    if (this.fracturePending && audible && !this.latest.paused && !this.overlayPaused && this.fracture) {
      this.fracturePending = false; this.fractureEvents++; this.record("fracture");
      this.playTransient(this.fracture, 0.70);
    }
  }
  /** Overlay/video ducking is independent of the current scene mix. */
  public setOverlayPaused(paused: boolean) {
    if (paused === this.overlayPaused) return;
    this.overlayPaused = paused; this.fracturePending = false;
    if (paused) this.stopVoices(0.02);
    this.schedule();
  }
  /** Reserved for a verified hold binding. Production never binds pointer-down
   * and this API never touches the visual motion rate. */
  public setHeld(held: boolean) { if (held === this.held) return; this.held = held; this.schedule(); }
  private stopVoices(fade = 0) {
    for (const [voice, gain] of this.voices) {
      if (fade && this.ctx?.state === "running") {
        const now = this.ctx.currentTime, current = gain.gain.value;
        gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(current, now);
        gain.gain.linearRampToValueAtTime(0, now + fade);
        try { voice.stop(now + fade + 0.005); } catch {}
        // onended disconnects BOTH nodes. No timers or stale long-lived voices.
      } else {
        try { voice.stop(); } catch {}
        voice.onended = null; voice.disconnect(); gain.disconnect(); this.voices.delete(voice);
      }
    }
  }
  private stopSources() {
    this.stopVoices();
    for (const { source, gain } of this.stems) { try { source.stop(); } catch {} source.disconnect(); gain.disconnect(); }
    this.stems = [];
  }
  private playTransient(buffer: AudioBuffer, level: number) {
    if (!this.ctx || !this.effects || !this.requested || this.hidden || this.latest.paused || this.overlayPaused || this.voices.size >= 12) return;
    const source = this.ctx.createBufferSource(), gain = this.ctx.createGain();
    source.buffer = buffer; gain.gain.value = level;
    source.connect(gain); gain.connect(this.effects); this.voices.set(source, gain);
    source.onended = () => { this.voices.delete(source); source.disconnect(); gain.disconnect(); };
    source.start();
  }
  private tone(hz: number, duration: number, level: number) {
    if (!this.ctx || !this.effects || !this.requested || this.hidden || this.latest.paused || this.overlayPaused || this.voices.size >= 12) return;
    try {
      const ctx = this.ctx, source = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
      source.type = "sine"; source.frequency.value = hz;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(level, now + 0.008); gain.gain.linearRampToValueAtTime(0, now + duration);
      source.connect(gain); gain.connect(this.effects); this.voices.set(source, gain);
      source.onended = () => { this.voices.delete(source); source.disconnect(); gain.disconnect(); };
      source.start(now); source.stop(now + duration + 0.01);
    } catch (error) { this.fail(error, this.epoch); }
  }
  public playHover() { this.tone(880, 0.045, 0.035); }
  public playHoverTick() { this.playHover(); }
  public playClick() { this.tone(220, 0.085, 0.07); }
  public playChime(hz = 659.25, duration = 0.09) { this.tone(hz, duration, 0.05); }
  public playTransitionWhoosh() { this.tone(110, 0.32, 0.07); }
  /** Retained compatibility; no callers may overwrite the stage filter. */
  public modulateByVelocity(velocity: number) { void velocity; /* scene mix owns tonal state */ }
  public dispose() {
    this.epoch++; this.requested = false; this.cleanListeners?.(); this.cleanListeners = null; this.owners = 0;
    this.clearGraph();
    if (this.ctx) { this.ctx.onstatechange = null; void this.ctx.close().catch(() => {}); }
    this.ctx = null; this.master = this.music = this.effects = null; this.stageFilter = this.holdFilter = null;
    this.score = null; this.fracture = null; this.status = "off"; this.ramps = new WeakMap(); this.notify();
  }
}
export const soundEngine = new JourneySoundEngine();

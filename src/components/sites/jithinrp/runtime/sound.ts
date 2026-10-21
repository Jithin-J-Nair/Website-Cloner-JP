/**
 * Sound, as on the reference site: a looping lofi track plus small synthesised
 * water drops on hover (case-study rows get a deeper double plop, links a single
 * drip, tool chips a high tick). Browsers keep audio locked until the first
 * gesture, so the switch reads "Click for sound" until then.
 */

export type SoundKind = "drop" | "bubble" | "tick";
export type SoundState = { enabled: boolean; unlocked: boolean };

const STORAGE_KEY = "jrp-sound";
const MUSIC_VOLUME = 0.22;
const MUSIC_SRC = "/sites/jithinrp/audio/lofi-bgm.mp3";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private music: HTMLAudioElement | null = null;
  private listeners = new Set<(state: SoundState) => void>();
  private enabled = true;
  private unlocked = false;

  constructor() {
    if (typeof window === "undefined") return;
    try {
      this.enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
      this.enabled = true;
    }
    const unlock = () => this.unlock();
    ["pointerdown", "keydown", "touchend"].forEach((evt) =>
      window.addEventListener(evt, unlock, { passive: true, once: false }),
    );
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() !== "m" || e.metaKey || e.ctrlKey || e.altKey) return;
      this.setEnabled(!this.enabled);
    });
  }

  get state(): SoundState {
    return { enabled: this.enabled, unlocked: this.unlocked };
  }

  subscribe(fn: (state: SoundState) => void) {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    const state = this.state;
    this.listeners.forEach((fn) => fn(state));
  }

  private ensureContext() {
    if (this.ctx) return this.ctx;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.3;
    const soften = ctx.createBiquadFilter();
    soften.type = "lowpass";
    soften.frequency.value = 4200;
    master.connect(soften).connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;

    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = noise;
    return ctx;
  }

  unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      this.emit();
    }
    if (this.enabled) this.startMusic();
  }

  private startMusic() {
    if (!this.enabled) return;
    if (!this.music) {
      const audio = new Audio(MUSIC_SRC);
      audio.loop = true;
      audio.preload = "none";
      audio.volume = 0;
      this.music = audio;
    }
    const music = this.music;
    if (!music.paused) return;
    const play = music.play();
    if (play) {
      play
        .then(() => {
          this.fadeTo(MUSIC_VOLUME);
        })
        .catch(() => {});
    }
  }

  private fadeTo(volume: number) {
    const music = this.music;
    if (!music) return;
    const from = music.volume;
    const started = performance.now();
    const step = () => {
      if (!this.music) return;
      const t = Math.min(1, (performance.now() - started) / 600);
      this.music.volume = from + (volume - from) * t;
      if (t < 1) requestAnimationFrame(step);
      else if (volume === 0) this.music.pause();
    };
    requestAnimationFrame(step);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      /* private mode */
    }
    this.emit();
    if (enabled) {
      this.unlock();
      this.play("drop");
    } else {
      this.fadeTo(0);
    }
  }

  /** One water drop: a sine whose pitch rises as the trapped bubble collapses. */
  private drip(opts: { f0: number; len: number; level: number; delay?: number }) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime + (opts.delay ?? 0);
    const out = ctx.createGain();
    out.connect(master);

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(opts.f0, t);
    osc.frequency.exponentialRampToValueAtTime(opts.f0 * 2.6, t + opts.len * 0.45);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(opts.level, t + 0.004);
    amp.gain.exponentialRampToValueAtTime(opts.level * 0.35, t + opts.len * 0.4);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + opts.len);
    osc.connect(amp).connect(out);
    osc.start(t);
    osc.stop(t + opts.len + 0.03);

    if (!this.noise) return;
    const splash = ctx.createBufferSource();
    splash.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = opts.f0 * 4;
    bp.Q.value = 1.2;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(opts.level * 0.25, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    splash.connect(bp).connect(sg).connect(out);
    splash.start(t);
    splash.stop(t + 0.02);
  }

  play(kind: SoundKind) {
    if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    if (kind === "tick") {
      this.drip({ f0: rand(1500, 2100), len: 0.05, level: 0.1 });
      return;
    }
    if (kind === "bubble") {
      this.drip({ f0: rand(190, 250), len: 0.2, level: 0.35 });
      this.drip({ f0: rand(320, 420), len: 0.16, level: 0.22, delay: 0.075 });
      return;
    }
    this.drip({ f0: rand(520, 760), len: 0.13, level: 0.22 });
  }
}

let engine: SoundEngine | null = null;

export function getSound(): SoundEngine {
  if (!engine) engine = new SoundEngine();
  return engine;
}

/** Hover sounds, in the source's order: tool chip → card → link/button. */
export function attachHoverSounds(root: HTMLElement) {
  const sound = getSound();
  let current: Element | null = null;
  root.addEventListener(
    "pointerover",
    (event) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target as Element | null;
      const hit: Element | null =
        target?.closest(".tool") ??
        target?.closest("[data-href], .ai-card") ??
        target?.closest("a, button") ??
        null;
      if (hit === current) return;
      current = hit;
      if (!hit) return;
      if (hit.classList.contains("tool")) sound.play("tick");
      else if (hit.matches("[data-href], .ai-card")) sound.play("bubble");
      else sound.play("drop");
    },
    { passive: true },
  );
}

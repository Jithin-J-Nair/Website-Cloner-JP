"use client";

/**
 * Lusion Spatial & UI Audio Engine (`soundEngine`)
 *
 * Plays locally staged `.ogg` foley buffers (`/assets/audios/generic.ogg`,
 * `hover_0..2.ogg`, `click_0..1.ogg`, `page_0..1.ogg`) when present on disk, and
 * falls back seamlessly to synthesized Web Audio harmonics with zero errors when
 * run from a clean Git checkout without optional media binaries.
 * Strictly muted on load and activated only after explicit user gesture.
 */

type BufferKey =
  | "ambient"
  | "hover_0"
  | "hover_1"
  | "hover_2"
  | "click_0"
  | "click_1"
  | "page_0"
  | "page_1";

const AUDIO_PATHS: Record<BufferKey, string> = {
  ambient: "/assets/audios/generic.ogg",
  hover_0: "/assets/audios/hover_0.ogg",
  hover_1: "/assets/audios/hover_1.ogg",
  hover_2: "/assets/audios/hover_2.ogg",
  click_0: "/assets/audios/click_0.ogg",
  click_1: "/assets/audios/click_1.ogg",
  page_0: "/assets/audios/page_0.ogg",
  page_1: "/assets/audios/page_1.ogg",
};

class LusionAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private ambientBufferSource: AudioBufferSourceNode | null = null;
  private synthOscillators: OscillatorNode[] = [];
  private buffers = new Map<BufferKey, AudioBuffer>();
  private loadingPromise: Promise<void> | null = null;
  private hoverIndex = 0;
  private clickIndex = 0;
  private pageIndex = 0;
  private enabled = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(520, ctx.currentTime);
      filter.Q.setValueAtTime(0.9, ctx.currentTime);

      filter.connect(master);
      master.connect(ctx.destination);

      this.ctx = ctx;
      this.filterNode = filter;
      this.masterGain = master;
    }
    return this.ctx;
  }

  private preloadLocalBuffers(): Promise<void> {
    if (!this.ctx) return Promise.resolve();
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const ctx = this.ctx;
      if (!ctx) return;

      await Promise.all(
        (Object.entries(AUDIO_PATHS) as [BufferKey, string][]).map(async ([key, url]) => {
          try {
            const res = await fetch(url, { cache: "force-cache" });
            if (!res.ok) return;
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("text/html")) return;
            const data = await res.arrayBuffer();
            if (data.byteLength < 64) return;
            const decoded = await ctx.decodeAudioData(data.slice(0));
            this.buffers.set(key, decoded);
          } catch {
            // Optional local asset absent or unsupported — synthesized fallback applies.
          }
        })
      );
    })();

    return this.loadingPromise;
  }

  private startAmbientBed(): void {
    if (!this.ctx || !this.filterNode) return;
    if (this.ambientBufferSource || this.synthOscillators.length > 0) return;

    const ambientBuf = this.buffers.get("ambient");
    if (ambientBuf) {
      const src = this.ctx.createBufferSource();
      src.buffer = ambientBuf;
      src.loop = true;
      const bedGain = this.ctx.createGain();
      bedGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
      src.connect(bedGain);
      bedGain.connect(this.filterNode);
      src.start();
      this.ambientBufferSource = src;
      return;
    }

    const freqs = [110, 164.81, 220];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.filterNode) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 2 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(idx === 0 ? 0.14 : 0.06, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.filterNode);
      osc.start();
      this.synthOscillators.push(osc);
    });
  }

  private playBufferOrFallback(key: BufferKey, gainLevel: number, fallbackFn: () => void): void {
    if (!this.enabled || !this.ctx) return;
    const buf = this.buffers.get(key);
    if (buf) {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start();
      return;
    }
    fallbackFn();
  }

  public setEnabled(next: boolean): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) {
      this.enabled = false;
      return false;
    }

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    this.enabled = next;

    if (next) {
      void this.preloadLocalBuffers().then(() => {
        if (this.enabled) {
          this.startAmbientBed();
        }
      });
      const now = ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.24, now, 0.25);
      this.playChime(587.33, 0.07);
    } else {
      const now = ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.16);
    }

    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public modulateByVelocity(normalizedVelocity: number): void {
    if (!this.enabled || !this.ctx || !this.filterNode) return;
    const clamped = Math.min(1, Math.max(0, normalizedVelocity));
    const targetCutoff = 480 + clamped * 1650;
    this.filterNode.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.12);
  }

  public playHover(): void {
    const idx = (this.hoverIndex++ % 3) as 0 | 1 | 2;
    this.playBufferOrFallback(`hover_${idx}`, 0.24, () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.04);
      gain.gain.setValueAtTime(0.032, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.052);
    });
  }

  public playHoverTick(): void {
    this.playHover();
  }

  public playClick(): void {
    const idx = (this.clickIndex++ % 2) as 0 | 1;
    this.playBufferOrFallback(`click_${idx}`, 0.3, () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(84, now + 0.075);
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.082);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.088);
    });
  }

  public playChime(freq = 659.25, duration = 0.09): void {
    const idx = (this.clickIndex++ % 2) as 0 | 1;
    this.playBufferOrFallback(`click_${idx}`, 0.26, () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + duration);
      gain.gain.setValueAtTime(0.048, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.04);
    });
  }

  public playTransitionWhoosh(): void {
    const idx = (this.pageIndex++ % 2) as 0 | 1;
    this.playBufferOrFallback(`page_${idx}`, 0.32, () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.34);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    });
  }
}

export const soundEngine = new LusionAudioEngine();

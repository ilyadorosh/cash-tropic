// sound.ts — the Grid's hum, synthesized like GameRadio: no files, just
// oscillators. A cycle is a filtered sawtooth that pitches with speed;
// turns blip; a derez is a noise burst falling through a lowpass.

export class TronSound {
  private ctx: AudioContext | null = null;
  private hum: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private muted = false;

  /** must be called from a user gesture (browser autoplay policy) */
  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext({ latencyHint: "interactive" });
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    this.hum = this.ctx.createOscillator();
    this.hum.type = "sawtooth";
    this.hum.frequency.value = 46;
    this.humGain = this.ctx.createGain();
    this.humGain.gain.value = 0;
    this.hum.connect(filter);
    filter.connect(this.humGain);
    this.humGain.connect(this.ctx.destination);
    this.hum.start();
  }

  setRunning(running: boolean) {
    if (!this.ctx || !this.humGain) return;
    const target = running && !this.muted ? 0.05 : 0.0001;
    this.humGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
  }

  /** pitch rises as the round speeds up */
  setPace(pace01: number) {
    if (!this.ctx || !this.hum) return;
    this.hum.frequency.setTargetAtTime(
      46 + pace01 * 40,
      this.ctx.currentTime,
      0.3,
    );
  }

  turn() {
    this.blip(660, 0.045, 0.035);
  }

  countdown(final: boolean) {
    this.blip(final ? 880 : 440, 0.09, 0.05);
  }

  derez() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * 0.35,
      this.ctx.sampleRate,
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3600, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.34);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.setRunning(!this.muted);
    return this.muted;
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.hum = null;
    this.humGain = null;
  }

  private blip(freq: number, dur: number, vol: number) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}

export interface RadioStation {
  id: string;
  name: string;
  frequency: string;
  tempo: number;
  lead: Array<number | null>;
  bass: Array<number | null>;
  chords: Record<number, number[]>;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
}

export interface RadioSnapshot {
  station: RadioStation | null;
  playing: boolean;
  inVehicle: boolean;
}

type SnapshotListener = (snapshot: RadioSnapshot) => void;

const STORAGE_KEY = "cash-tropic:radio-station";

// Original, tiny note sequences. They occupy less space than a single icon
// and can later be replaced by parsed MIDI while keeping the same station API.
export const RADIO_STATIONS: RadioStation[] = [
  {
    id: "aufsess",
    name: "AUFSESS",
    frequency: "90.2",
    tempo: 92,
    lead: [
      69,
      null,
      72,
      null,
      76,
      null,
      72,
      71,
      69,
      null,
      67,
      null,
      64,
      67,
      69,
      null,
    ],
    bass: [
      45,
      null,
      null,
      null,
      41,
      null,
      null,
      null,
      43,
      null,
      null,
      null,
      40,
      null,
      43,
      null,
    ],
    chords: {
      0: [57, 60, 64],
      4: [53, 57, 60],
      8: [55, 59, 62],
      12: [52, 55, 59],
    },
    leadWave: "triangle",
    bassWave: "sine",
  },
  {
    id: "thermal",
    name: "THERMAL FM",
    frequency: "77.0",
    tempo: 116,
    lead: [
      76,
      76,
      null,
      79,
      81,
      null,
      79,
      null,
      74,
      74,
      null,
      76,
      79,
      null,
      76,
      null,
    ],
    bass: [
      40,
      null,
      40,
      null,
      43,
      null,
      43,
      null,
      36,
      null,
      36,
      null,
      38,
      null,
      43,
      null,
    ],
    chords: {
      0: [52, 55, 59],
      4: [55, 59, 62],
      8: [48, 52, 55],
      12: [50, 53, 57],
    },
    leadWave: "square",
    bassWave: "sawtooth",
  },
  {
    id: "nacht",
    name: "NÜRNBERG NACHT",
    frequency: "101.6",
    tempo: 74,
    lead: [
      64,
      null,
      67,
      71,
      null,
      69,
      67,
      null,
      62,
      null,
      64,
      67,
      null,
      66,
      64,
      null,
    ],
    bass: [
      40,
      null,
      null,
      null,
      36,
      null,
      null,
      null,
      38,
      null,
      null,
      null,
      35,
      null,
      38,
      null,
    ],
    chords: {
      0: [52, 55, 59],
      4: [48, 52, 55],
      8: [50, 54, 57],
      12: [47, 50, 54],
    },
    leadWave: "sine",
    bassWave: "triangle",
  },
];

function midiFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

export class GameRadio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private scheduler: number | null = null;
  private nextStepAt = 0;
  private step = 0;
  private stationIndex = 0;
  private off = false;
  private inVehicle = true;
  private ducked = false;
  private listener: SnapshotListener;

  constructor(listener: SnapshotListener) {
    this.listener = listener;
    if (typeof window !== "undefined") {
      const saved = Number.parseInt(
        localStorage.getItem(STORAGE_KEY) || "0",
        10,
      );
      if (saved >= 0 && saved <= RADIO_STATIONS.length) {
        this.off = saved === RADIO_STATIONS.length;
        this.stationIndex = this.off ? 0 : saved;
      }
      document.addEventListener("visibilitychange", this.handleVisibility);
    }
    this.emit();
  }

  getSnapshot(): RadioSnapshot {
    return {
      station: this.off ? null : RADIO_STATIONS[this.stationIndex],
      playing: this.isPlaying(),
      inVehicle: this.inVehicle,
    };
  }

  async activate() {
    if (!this.inVehicle || this.off) return;
    await this.ensureAudio();
    if (this.context?.state === "suspended") await this.context.resume();
    this.startScheduler();
    this.applyVolume();
    this.emit();
  }

  async cycle() {
    if (this.off) {
      this.off = false;
      this.stationIndex = 0;
    } else if (this.stationIndex === RADIO_STATIONS.length - 1) {
      this.off = true;
      this.stopScheduler();
    } else {
      this.stationIndex += 1;
      this.resetSequence();
    }
    this.persist();
    if (!this.off) await this.activate();
    this.applyVolume();
    this.emit();
  }

  async setInVehicle(inVehicle: boolean) {
    this.inVehicle = inVehicle;
    if (inVehicle) {
      await this.activate();
    } else {
      this.stopScheduler();
      this.applyVolume();
      this.emit();
    }
  }

  setDucked(ducked: boolean) {
    this.ducked = ducked;
    this.applyVolume();
  }

  async dispose() {
    this.stopScheduler();
    document.removeEventListener("visibilitychange", this.handleVisibility);
    if (this.context && this.context.state !== "closed") {
      await this.context.close();
    }
    this.context = null;
    this.master = null;
  }

  private handleVisibility = () => {
    if (document.hidden) {
      this.stopScheduler();
      void this.context?.suspend();
    } else if (this.inVehicle && !this.off) {
      void this.activate();
    }
  };

  private async ensureAudio() {
    if (this.context) return;
    this.context = new AudioContext({ latencyHint: "playback" });
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);
  }

  private startScheduler() {
    if (
      !this.context ||
      this.scheduler !== null ||
      this.off ||
      !this.inVehicle
    ) {
      return;
    }
    this.nextStepAt = this.context.currentTime + 0.06;
    this.scheduler = window.setInterval(() => this.scheduleAhead(), 100);
    this.scheduleAhead();
  }

  private stopScheduler() {
    if (this.scheduler !== null) {
      window.clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  private resetSequence() {
    this.step = 0;
    if (this.context) this.nextStepAt = this.context.currentTime + 0.06;
  }

  private scheduleAhead() {
    const context = this.context;
    if (!context || this.off || !this.inVehicle || document.hidden) return;
    const station = RADIO_STATIONS[this.stationIndex];
    const stepDuration = 60 / station.tempo / 4;
    const horizon = context.currentTime + 0.45;

    while (this.nextStepAt < horizon) {
      this.scheduleStep(station, this.step, this.nextStepAt, stepDuration);
      this.step = (this.step + 1) % 16;
      this.nextStepAt += stepDuration;
    }
  }

  private scheduleStep(
    station: RadioStation,
    step: number,
    time: number,
    stepDuration: number,
  ) {
    const lead = station.lead[step];
    const bass = station.bass[step];
    if (lead !== null) {
      this.playNote(lead, time, stepDuration * 0.78, station.leadWave, 0.055);
    }
    if (bass !== null) {
      this.playNote(bass, time, stepDuration * 1.7, station.bassWave, 0.075);
    }
    const chord = station.chords[step];
    chord?.forEach((note) => {
      this.playNote(note, time, stepDuration * 3.5, "sine", 0.018);
    });
    if (step % 4 === 0) this.playKick(time, stepDuration * 0.9);
  }

  private playNote(
    note: number,
    time: number,
    duration: number,
    wave: OscillatorType,
    volume: number,
  ) {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(midiFrequency(note), time);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(volume, time + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  private playKick(time: number, duration: number) {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(92, time);
    oscillator.frequency.exponentialRampToValueAtTime(44, time + duration);
    envelope.gain.setValueAtTime(0.09, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  private applyVolume() {
    if (!this.context || !this.master) return;
    const audible = this.inVehicle && !this.off && !document.hidden;
    const target = audible ? (this.ducked ? 0.22 : 0.72) : 0.0001;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(target, this.context.currentTime, 0.08);
  }

  private isPlaying() {
    return Boolean(
      this.context &&
      this.context.state === "running" &&
      this.scheduler !== null &&
      this.inVehicle &&
      !this.off,
    );
  }

  private persist() {
    localStorage.setItem(
      STORAGE_KEY,
      String(this.off ? RADIO_STATIONS.length : this.stationIndex),
    );
  }

  private emit() {
    this.listener(this.getSnapshot());
  }
}

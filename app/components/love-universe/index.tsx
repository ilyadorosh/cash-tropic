"use client";

/* ACT IN LOVE — universe edition, social heart.
   Port of act-in-love v3.1 (starfield, love organ, tamagotchi) fused with the
   live social layer: from→to connect, constellation log, gravity wells. */

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Syne, Hanken_Grotesk } from "next/font/google";
import {
  createPlayer,
  fetchWeights,
  type Player as NcaPlayer,
} from "@/app/nca/player/engine";
import styles from "./love-universe.module.scss";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
  variable: "--font-hanken",
});

/* ================= types ================= */

export type FeedEvent = {
  type: "page_created" | "response" | "follow";
  from: string;
  to: string;
  preview?: string;
  ts: number;
};

export type TrendingPage = { from: string; to: string; score: number };
export type TrendingProfile = { username: string; score: number };

type Props = {
  initialFeed: FeedEvent[];
  trendingPages: TrendingPage[];
  trendingProfiles: TrendingProfile[];
};

type Chord = {
  name: string;
  mood: string;
  notes: number[];
  hue: string;
  bg: string;
};
type Palette = {
  id: string;
  label: string;
  cr: string;
  bpm: number;
  chords: Chord[];
};

/* ================= the love library ================= */

const PAL: Palette[] = [
  {
    id: "ninths",
    label: "ninths",
    cr: "downtempo dreams",
    bpm: 122,
    chords: [
      {
        name: "Am9",
        mood: "longing",
        notes: [45, 52, 60, 67, 71],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "Fmaj9",
        mood: "warmth",
        notes: [41, 48, 57, 64, 67],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "Cmaj9",
        mood: "home",
        notes: [48, 55, 62, 64, 71],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
      {
        name: "Em9",
        mood: "dusk",
        notes: [40, 47, 55, 62, 66],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "Dm9",
        mood: "rain",
        notes: [38, 45, 53, 60, 64],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
    ],
  },
  {
    id: "axis",
    label: "axis of love",
    cr: "every anthem ever",
    bpm: 122,
    chords: [
      {
        name: "Cadd9",
        mood: "begin",
        notes: [48, 55, 62, 64],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
      {
        name: "Gadd9",
        mood: "rise",
        notes: [43, 50, 57, 59],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "Am(add9)",
        mood: "ache",
        notes: [45, 52, 59, 60, 64],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "Fadd9",
        mood: "release",
        notes: [41, 48, 55, 57],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
    ],
  },
  {
    id: "thislove",
    label: "this love",
    cr: "feisty minor turn",
    bpm: 124,
    chords: [
      {
        name: "Cm9",
        mood: "pull",
        notes: [48, 51, 58, 62, 67],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "G7♭9",
        mood: "push",
        notes: [43, 53, 56, 59],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
      {
        name: "Fm9",
        mood: "plead",
        notes: [41, 44, 48, 51, 55],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "A♭maj9",
        mood: "swoon",
        notes: [44, 48, 51, 55, 58],
        hue: "#ff90bd",
        bg: "var(--pink)",
      },
    ],
  },
  {
    id: "ocean",
    label: "ocean",
    cr: "pink + white skies",
    bpm: 118,
    chords: [
      {
        name: "Dmaj9",
        mood: "glow",
        notes: [50, 54, 57, 61, 64],
        hue: "#ff90bd",
        bg: "var(--pink)",
      },
      {
        name: "Bm11",
        mood: "drift",
        notes: [47, 50, 54, 57, 64],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "Gmaj13",
        mood: "halo",
        notes: [43, 50, 54, 59, 64],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
      {
        name: "A13sus",
        mood: "exhale",
        notes: [45, 52, 55, 62, 66],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
    ],
  },
  {
    id: "strobe",
    label: "strobe",
    cr: "10-minute sunrise",
    bpm: 128,
    chords: [
      {
        name: "C♯m7",
        mood: "night",
        notes: [49, 52, 56, 59, 64],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "Amaj9",
        mood: "open",
        notes: [45, 52, 56, 59, 61],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "Eadd9",
        mood: "arrive",
        notes: [40, 47, 52, 56, 66],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
      {
        name: "Bsus4(9)",
        mood: "lift",
        notes: [47, 54, 59, 61, 64],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
    ],
  },
  {
    id: "dusk",
    label: "nordic dusk",
    cr: "melancholy machines",
    bpm: 120,
    chords: [
      {
        name: "Em9",
        mood: "fjord",
        notes: [40, 47, 55, 62, 66],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "Cmaj7♯11",
        mood: "aurora",
        notes: [48, 55, 59, 64, 66],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
      {
        name: "Gmaj7",
        mood: "ember",
        notes: [43, 50, 54, 59],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "Bm7",
        mood: "orbit",
        notes: [47, 54, 57, 62],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
    ],
  },
  {
    id: "smooth-jazz",
    label: "smooth jazz",
    cr: "velvet midnight",
    bpm: 98,
    chords: [
      {
        name: "Dm9",
        mood: "smoke",
        notes: [50, 57, 60, 64, 67],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "G13",
        mood: "whiskey",
        notes: [43, 50, 55, 59, 64],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "Cmaj9♯11",
        mood: "silk",
        notes: [48, 55, 60, 64, 66],
        hue: "#ff90bd",
        bg: "var(--pink)",
      },
      {
        name: "F♯m11",
        mood: "moonlight",
        notes: [53, 57, 61, 64, 66],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
      {
        name: "B♭m9",
        mood: "leather",
        notes: [46, 53, 57, 60, 64],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
    ],
  },
  {
    id: "lounge",
    label: "lounge",
    cr: "neon dawn",
    bpm: 104,
    chords: [
      {
        name: "Em9",
        mood: "haze",
        notes: [40, 47, 52, 56, 60],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
      {
        name: "A7♯9",
        mood: "mystery",
        notes: [45, 52, 56, 60, 64],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "Cmaj7",
        mood: "sunset",
        notes: [48, 52, 55, 60],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "F♯m7♭5",
        mood: "shadow",
        notes: [41, 46, 50, 53],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "Bm11",
        mood: "breeze",
        notes: [47, 50, 54, 57, 60],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
    ],
  },
  {
    id: "vaporwave",
    label: "vaporwave",
    cr: "mall soft",
    bpm: 110,
    chords: [
      {
        name: "Fmaj7",
        mood: "elevator",
        notes: [41, 48, 53, 57],
        hue: "#ff90bd",
        bg: "var(--pink)",
      },
      {
        name: "Dm7",
        mood: "escalator",
        notes: [50, 57, 60, 64],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "B♭maj7",
        mood: "fountain",
        notes: [46, 53, 57, 60],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "Gm7",
        mood: "palm tree",
        notes: [43, 50, 53, 57],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
    ],
  },
  {
    id: "liminal",
    label: "liminal",
    cr: "backrooms",
    bpm: 88,
    chords: [
      {
        name: "Cm7",
        mood: "hallway",
        notes: [48, 51, 55, 58],
        hue: "#181410",
        bg: "var(--ink)",
      },
      {
        name: "A♭maj7",
        mood: "buzz",
        notes: [44, 48, 51, 55],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
      {
        name: "E♭7sus4",
        mood: "flicker",
        notes: [51, 55, 58, 61],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "Fm7",
        mood: "static",
        notes: [41, 44, 48, 51],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
    ],
  },
  {
    id: "flume",
    label: "flume",
    cr: "future nostalgia",
    bpm: 126,
    chords: [
      {
        name: "C♯m7",
        mood: "glitch",
        notes: [49, 52, 56, 59],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
      {
        name: "Amaj7",
        mood: "bloom",
        notes: [45, 52, 56, 59, 61],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "F♯m7",
        mood: "pulse",
        notes: [41, 46, 50, 53],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
      {
        name: "Dmaj7",
        mood: "float",
        notes: [50, 54, 57, 61],
        hue: "#ff90bd",
        bg: "var(--pink)",
      },
    ],
  },
  {
    id: "tame-impala",
    label: "tame impala",
    cr: "psychedelic pop",
    bpm: 102,
    chords: [
      {
        name: "Am7",
        mood: "dream",
        notes: [45, 52, 55, 58],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "Fmaj7",
        mood: "waves",
        notes: [41, 48, 53, 57],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "C/G",
        mood: "swirl",
        notes: [39, 48, 52, 55],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
      {
        name: "D7sus4",
        mood: "spin",
        notes: [50, 54, 57, 61],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
    ],
  },
  {
    id: "lilpeep",
    label: "Lil Peep",
    cr: "gone",
    bpm: 140,
    chords: [
      {
        name: "Em7",
        mood: "pain",
        notes: [40, 47, 52, 55],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "Cmaj7",
        mood: "hope",
        notes: [48, 52, 55, 60],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "G7",
        mood: "struggle",
        notes: [43, 50, 53, 57],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "Am7",
        mood: "longing",
        notes: [45, 52, 55, 58],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
    ],
  },
  {
    id: "royksopp",
    label: "Röyksopp",
    cr: "melancholy synths",
    bpm: 128,
    chords: [
      {
        name: "C♯m7",
        mood: "dark",
        notes: [49, 52, 56, 59],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "Amaj7",
        mood: "bright",
        notes: [45, 52, 56, 59, 61],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "F♯m7",
        mood: "cool",
        notes: [41, 46, 50, 53],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "Dmaj7",
        mood: "float",
        notes: [50, 54, 57, 61],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
    ],
  },
  {
    id: "aloboi",
    label: "aloboi",
    cr: "cool",
    bpm: 102,
    chords: [
      {
        name: "Em7",
        mood: "chill",
        notes: [40, 47, 52, 55],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "A7",
        mood: "tension",
        notes: [45, 52, 55, 59],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "C♯m7",
        mood: "mystery",
        notes: [49, 52, 56, 59],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "F♯m7",
        mood: "depth",
        notes: [41, 46, 50, 53],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
    ],
  },
  {
    id: "harry",
    label: "Harry Styles",
    cr: "as it was",
    bpm: 96,
    chords: [
      {
        name: "Cmaj7",
        mood: "warmth",
        notes: [48, 52, 55, 60],
        hue: "#ff90bd",
        bg: "var(--pink)",
      },
      {
        name: "F♯m7",
        mood: "ache",
        notes: [41, 46, 50, 53],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "G7",
        mood: "lift",
        notes: [43, 50, 53, 57],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "Am7",
        mood: "longing",
        notes: [45, 52, 55, 58],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
    ],
  },
  {
    id: "jayz",
    label: "Jay-Z",
    cr: "empire state of mind",
    bpm: 92,
    chords: [
      {
        name: "Cm7",
        mood: "hustle",
        notes: [48, 51, 55, 58],
        hue: "#ff5e4d",
        bg: "var(--coral)",
      },
      {
        name: "E♭maj7",
        mood: "luxury",
        notes: [51, 55, 58, 62],
        hue: "#ffcb2e",
        bg: "var(--yellow)",
      },
      {
        name: "Fm7",
        mood: "grind",
        notes: [41, 44, 48, 51],
        hue: "#2d6cf6",
        bg: "var(--blue)",
      },
      {
        name: "B♭7",
        mood: "victory",
        notes: [46, 50, 53, 57],
        hue: "#34d6a0",
        bg: "var(--mint)",
      },
    ],
  },
  {
    id: "vapor-dreams",
    label: "vaporwave dreams",
    cr: "macintosh plus",
    bpm: 96,
    chords: [
      {
        name: "Cmaj7♯11",
        mood: "float",
        notes: [48, 55, 59, 63, 66],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
      {
        name: "Am9sus4",
        mood: "drift",
        notes: [45, 52, 59, 62, 67],
        hue: "#26d9cc",
        bg: "var(--teal)",
      },
      {
        name: "Fmaj13",
        mood: "haze",
        notes: [41, 48, 53, 57, 61, 66],
        hue: "#ffa02e",
        bg: "var(--amber)",
      },
      {
        name: "Dm11♭5",
        mood: "liminal",
        notes: [38, 45, 52, 55, 62],
        hue: "#3d5bd9",
        bg: "var(--ultra)",
      },
    ],
  },
  {
    id: "smooth-lounge",
    label: "smooth lounge",
    cr: "kid francescoli vibes",
    bpm: 88,
    chords: [
      {
        name: "Gmaj9♯11",
        mood: "settle",
        notes: [43, 50, 54, 59, 64],
        hue: "#26d9cc",
        bg: "var(--teal)",
      },
      {
        name: "Em11",
        mood: "sway",
        notes: [40, 47, 52, 55, 62],
        hue: "#9d86ff",
        bg: "var(--lav)",
      },
      {
        name: "Cmaj13♯11",
        mood: "ease",
        notes: [48, 55, 59, 63, 66, 71],
        hue: "#ffa02e",
        bg: "var(--amber)",
      },
      {
        name: "Asus4(add9)",
        mood: "breathe",
        notes: [45, 52, 57, 64],
        hue: "#ff90bd",
        bg: "var(--pink)",
      },
    ],
  },
  {
    id: "backrooms-edge",
    label: "backrooms edge",
    cr: "rone + tame impala",
    bpm: 104,
    chords: [
      {
        name: "B♭maj7sus2",
        mood: "eerie",
        notes: [46, 53, 57, 62],
        hue: "#3d5bd9",
        bg: "var(--ultra)",
      },
      {
        name: "Fm9",
        mood: "pulse",
        notes: [41, 44, 48, 51, 55],
        hue: "#ff90bd",
        bg: "var(--pink)",
      },
      {
        name: "D♭maj9♯11",
        mood: "shimmer",
        notes: [49, 56, 60, 64, 67],
        hue: "#26d9cc",
        bg: "var(--teal)",
      },
      {
        name: "A♭m(maj7)",
        mood: "resolve?",
        notes: [44, 51, 55, 59, 62],
        hue: "#ffa02e",
        bg: "var(--amber)",
      },
    ],
  },
];

const LOCRIAN: Chord = {
  name: "E7♭9♭13",
  mood: "the abyss",
  notes: [40, 56, 62, 65, 72],
  hue: "#181410",
  bg: "var(--ink)",
};

const ACTS = [
  "Text someone: “thought of you today.” Nothing else.",
  "Pay for the coffee of whoever's behind you.",
  "Write one honest sentence of praise to a coworker.",
  "Call a grandparent. Let them talk too long.",
  "Leave a 20% bigger tip than usual, no reason.",
  "Forgive the small thing you've been holding onto.",
  "Compliment a stranger's something. Mean it.",
  "Let the other car merge. Wave like you meant it.",
  "Tell a friend the specific reason you're glad they exist.",
  "Give your full attention to one person for ten minutes.",
  "Send a thank-you to someone who'll never expect it.",
  "Check on the friend who went quiet.",
  "Learn “I love you” in their first language. Use it.",
];

const FACES = [
  "ヾ(⌐■_■)ノ♪",
  "\\(🖤♪🖤)/",
  "(｡♥‿♥｡)♪",
  "(◕‿◕)♬",
  "ʕ•ᴥ•ʔ♪",
  "♪(´θ`)ノ",
  "\\(^ω^)/",
];

const MARQUEE = [
  "CALL YOUR MOM",
  "OUTACT THEM IN LOVE",
  "TIP DOUBLE",
  "WIN EUROVISION",
  "FORGIVE FAST",
  "我爱你 — SAY IT EVERYWHERE",
  "LISTEN LONGER",
  "TEXT FIRST",
  "SHARE THE LAST BITE",
];

const FEED_ICONS: Record<string, string> = {
  page_created: "✨",
  response: "💬",
  follow: "💫",
};

const STAR_COLS = [
  "#ff5e4d",
  "#2d6cf6",
  "#ffcb2e",
  "#34d6a0",
  "#ff90bd",
  "#9d86ff",
  "#181410",
];
const BITS = ["♥", "✶", "●", "▲", "■", "♪", "✦"];
const COLS = ["#ff5e4d", "#2d6cf6", "#ffcb2e", "#34d6a0", "#ff90bd", "#9d86ff"];

/* ================= audio engine (module-level, pure) ================= */

type Engine = {
  ac: AudioContext;
  master: GainNode;
  padBus: GainNode;
  dly: DelayNode;
  noiseBuf: AudioBuffer;
};

function midiF(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function createEngine(): Engine | null {
  let ac: AudioContext;
  try {
    ac = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 18;
  comp.ratio.value = 5;
  comp.attack.value = 0.004;
  comp.release.value = 0.22;
  const master = ac.createGain();
  master.gain.value = 0.75;
  const padBus = ac.createGain();
  padBus.gain.value = 1;
  padBus.connect(master);
  const dly = ac.createDelay(1.5);
  dly.delayTime.value = 0.42;
  const fbk = ac.createGain();
  fbk.gain.value = 0.32;
  const dlp = ac.createBiquadFilter();
  dlp.type = "lowpass";
  dlp.frequency.value = 1700;
  const wetG = ac.createGain();
  wetG.gain.value = 0.22;
  dly.connect(dlp);
  dlp.connect(fbk);
  fbk.connect(dly);
  dlp.connect(wetG);
  master.connect(comp);
  wetG.connect(comp);
  comp.connect(ac.destination);
  const noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return { ac, master, padBus, dly, noiseBuf };
}

function toPad(e: Engine, node: AudioNode) {
  node.connect(e.padBus);
  node.connect(e.dly);
}

function duck(e: Engine, t: number) {
  e.padBus.gain.cancelScheduledValues(t);
  e.padBus.gain.setValueAtTime(0.33, t);
  e.padBus.gain.linearRampToValueAtTime(1, t + 0.27);
}

type ChordOpt = {
  vol?: number;
  dur?: number;
  attack?: number;
  type?: OscillatorType;
  strum?: number;
  bright?: number;
};

function playChord(e: Engine, t: number, ch: Chord, opt: ChordOpt = {}) {
  const vol = opt.vol || 0.13,
    dur = opt.dur || 2.6,
    atk = opt.attack != null ? opt.attack : 0.05,
    type = opt.type || "sawtooth",
    strum = opt.strum != null ? opt.strum : 0.014,
    bright = opt.bright || 2300;
  const n = ch.notes.length;
  ch.notes.forEach((m, i) => {
    const tt = t + i * strum,
      f = midiF(m);
    const o1 = e.ac.createOscillator(),
      o2 = e.ac.createOscillator();
    o1.type = type;
    o2.type = type === "sawtooth" ? "triangle" : type;
    o1.frequency.value = f;
    o2.frequency.value = f;
    o1.detune.value = -6;
    o2.detune.value = 7;
    const flt = e.ac.createBiquadFilter();
    flt.type = "lowpass";
    flt.Q.value = 0.8;
    flt.frequency.setValueAtTime(650, tt);
    flt.frequency.exponentialRampToValueAtTime(bright, tt + atk + 0.12);
    flt.frequency.exponentialRampToValueAtTime(550, tt + dur);
    const g = e.ac.createGain();
    g.gain.setValueAtTime(0, tt);
    g.gain.linearRampToValueAtTime(vol, tt + atk);
    g.gain.setTargetAtTime(0.0001, tt + dur * 0.45, dur * 0.3);
    o1.connect(flt);
    o2.connect(flt);
    flt.connect(g);
    let last: AudioNode = g;
    if (e.ac.createStereoPanner) {
      const p = e.ac.createStereoPanner();
      p.pan.value = n > 1 ? (i / (n - 1) - 0.5) * 0.85 : 0;
      g.connect(p);
      last = p;
    }
    toPad(e, last);
    o1.start(tt);
    o2.start(tt);
    o1.stop(tt + dur + 2.5);
    o2.stop(tt + dur + 2.5);
  });
}

function ping(e: Engine, m: number, t: number, vol = 0.11) {
  const o = e.ac.createOscillator();
  o.type = "sine";
  o.frequency.value = midiF(m);
  const g = e.ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g);
  toPad(e, g);
  o.start(t);
  o.stop(t + 0.9);
}

function bassPad(e: Engine, t: number, m: number, dur: number) {
  const o = e.ac.createOscillator();
  o.type = "sine";
  o.frequency.value = midiF(m);
  const o2 = e.ac.createOscillator();
  o2.type = "triangle";
  o2.frequency.value = midiF(m);
  o2.detune.value = 4;
  const lp = e.ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 320;
  const g = e.ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.2, t + 0.03);
  g.gain.setTargetAtTime(0.0001, t + dur * 0.6, 0.22);
  o.connect(lp);
  o2.connect(lp);
  lp.connect(g);
  g.connect(e.padBus);
  o.start(t);
  o2.start(t);
  o.stop(t + dur + 1);
  o2.stop(t + dur + 1);
}

function bassPluck(e: Engine, t: number, m: number, len = 0.22, vol = 0.22) {
  const o = e.ac.createOscillator();
  o.type = "sawtooth";
  o.frequency.value = midiF(m);
  const lp = e.ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 2;
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.exponentialRampToValueAtTime(180, t + len);
  const g = e.ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(lp);
  lp.connect(g);
  g.connect(e.padBus);
  o.start(t);
  o.stop(t + len + 0.1);
}

function kick(e: Engine, t: number, v = 1) {
  const o = e.ac.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.15);
  const g = e.ac.createGain();
  g.gain.setValueAtTime(0.52 * v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
  o.connect(g);
  g.connect(e.master);
  o.start(t);
  o.stop(t + 0.42);
}

function hat(e: Engine, t: number, v: number, hp = 7500, dec = 0.05) {
  const s = e.ac.createBufferSource();
  s.buffer = e.noiseBuf;
  const f = e.ac.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = e.ac.createGain();
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
  s.connect(f);
  f.connect(g);
  g.connect(e.master);
  s.start(t);
  s.stop(t + dec + 0.05);
}

function openHat(e: Engine, t: number) {
  hat(e, t, 0.12, 6200, 0.22);
}

function clap(e: Engine, t: number) {
  const s = e.ac.createBufferSource();
  s.buffer = e.noiseBuf;
  const bp = e.ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1900;
  bp.Q.value = 0.9;
  const g = e.ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.15, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
  s.connect(bp);
  bp.connect(g);
  g.connect(e.master);
  g.connect(e.dly);
  s.start(t);
  s.stop(t + 0.25);
}

/* ================= dom FX (module-level) ================= */

function fxRipple(
  host: HTMLElement,
  x: number,
  y: number,
  color: string | null,
  big: boolean,
) {
  const r = document.createElement("div");
  r.className = styles.ripple;
  if (color) r.style.borderColor = color;
  r.style.left = x + "px";
  r.style.top = y + "px";
  host.appendChild(r);
  r.animate(
    [
      { transform: "translate(-50%,-50%) scale(1)", opacity: 0.9 },
      { transform: `translate(-50%,-50%) scale(${big ? 22 : 11})`, opacity: 0 },
    ],
    { duration: big ? 850 : 600, easing: "cubic-bezier(.2,.6,.3,1)" },
  ).onfinish = () => r.remove();
}

function fxBurst(host: HTMLElement, x: number, y: number, n = 18) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    s.className = styles.heart;
    s.textContent = BITS[Math.floor(Math.random() * BITS.length)];
    s.style.color = COLS[Math.floor(Math.random() * COLS.length)];
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.fontSize = 14 + Math.random() * 18 + "px";
    host.appendChild(s);
    const ang = Math.random() * Math.PI * 2,
      vel = 60 + Math.random() * 150;
    const dx = Math.cos(ang) * vel,
      dy = Math.sin(ang) * vel - 80,
      rot = Math.random() * 720 - 360;
    s.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${dx}px,${dy + 200}px) rotate(${rot}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 900 + Math.random() * 500,
        easing: "cubic-bezier(.2,.6,.3,1)",
      },
    ).onfinish = () => s.remove();
  }
}

function reltime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/* ================= component ================= */

export default function LoveUniverse({
  initialFeed,
  trendingPages,
  trendingProfiles,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /* UI state */
  const [soundOn, setSoundOn] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [styleMode, setStyleMode] = useState<"chill" | "house">("chill");
  const [swing, setSwing] = useState(false);
  const [streaks, setStreaks] = useState(false);
  const [curPal, setCurPal] = useState(0);
  const [now, setNow] = useState("—");
  const [goText, setGoText] = useState("GIVE ME ONE TO DO →");
  const [goSmall, setGoSmall] = useState(false);
  const [face, setFace] = useState(FACES[0]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [say, setSay] = useState("");
  const [showSay, setShowSay] = useState(false);
  const [feed, setFeed] = useState<FeedEvent[]>(initialFeed);
  const [online, setOnline] = useState<string[]>([]);
  const [ncaAlive, setNcaAlive] = useState(false);

  /* refs */
  const rootRef = useRef<HTMLDivElement>(null);
  const tamaCvRef = useRef<HTMLCanvasElement>(null);
  const tamaNcaRef = useRef<NcaPlayer | null>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const actsRef = useRef<HTMLElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const energyRef = useRef(0);
  const lookTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const trailLast = useRef(0);

  /* live mirror of state for the 25ms scheduler + global key handler */
  const live = useRef({
    style: "chill" as "chill" | "house",
    swing: false,
    streaks: false,
    curPal: 0,
    soundOn: true,
    playing: false,
    progIdx: 0,
    stepIdx: 0,
    nextTime: 0,
  });

  const ensure = useCallback((): Engine | null => {
    if (engineRef.current) {
      if (engineRef.current.ac.state === "suspended")
        engineRef.current.ac.resume();
      return engineRef.current;
    }
    engineRef.current = createEngine();
    if (engineRef.current) {
      engineRef.current.master.gain.value = live.current.soundOn ? 0.75 : 0;
    }
    return engineRef.current;
  }, []);

  const setAccent = useCallback((ch: Chord) => {
    rootRef.current?.style.setProperty("--acc", ch.hue);
    setNow(`${ch.name} · ${ch.mood}`);
  }, []);

  const pulse = useCallback((big: boolean) => {
    const w = wordRef.current;
    if (!w) return;
    w.classList.add(big ? styles.pulse : styles.kick);
    setTimeout(
      () => {
        w.classList.remove(styles.pulse);
        w.classList.remove(styles.kick);
      },
      big ? 140 : 90,
    );
  }, []);

  const strike = useCallback(
    (idx: number, x?: number, y?: number) => {
      const e = ensure();
      if (!e) return;
      const ch = PAL[live.current.curPal].chords[idx];
      if (!ch) return;
      if (live.current.soundOn)
        playChord(e, e.ac.currentTime + 0.02, ch, { vol: 0.14, dur: 2.8 });
      setAccent(ch);
      pulse(true);
      energyRef.current = Math.min(1, energyRef.current + 0.6);
      if (fxRef.current) {
        fxRipple(
          fxRef.current,
          x != null ? x : innerWidth / 2,
          y != null ? y : innerHeight * 0.36,
          ch.hue,
          true,
        );
      }
    },
    [ensure, setAccent, pulse],
  );

  /* ---------- sequencer ---------- */

  const bpmOf = useCallback(() => {
    return live.current.style === "house"
      ? PAL[live.current.curPal].bpm || 122
      : 76;
  }, []);

  const scheduler = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    const BEAT = 60 / bpmOf();
    const C =
      live.current.style === "house"
        ? { spb: 16, sd: BEAT / 4, BEAT }
        : { spb: 8, sd: BEAT / 2, BEAT };

    const vis = (t: number, ch: Chord, big: boolean) => {
      const ms = Math.max(0, (t - e.ac.currentTime) * 1000);
      setTimeout(() => {
        pulse(big);
        energyRef.current = Math.min(
          1,
          energyRef.current + (big ? 0.85 : 0.35),
        );
        if (big) {
          setAccent(ch);
          if (fxRef.current)
            fxRipple(
              fxRef.current,
              innerWidth / 2,
              innerHeight * 0.34,
              ch.hue,
              true,
            );
        }
      }, ms);
    };

    const roll = (t: number, sd: number) => {
      const n = 2 + Math.floor(Math.random() * 3);
      for (let k = 1; k <= n; k++)
        hat(e, t + (sd * k) / (n + 1), 0.04 + 0.02 * k, 6000 + 1200 * k, 0.035);
    };

    while (live.current.nextTime < e.ac.currentTime + 0.16) {
      const s = live.current.stepIdx % C.spb;
      const bar = Math.floor(live.current.stepIdx / C.spb);
      const chords = PAL[live.current.curPal].chords;
      const ch = chords[bar % chords.length];
      let t = live.current.nextTime;
      if (live.current.swing && s % 2 === 1) t += C.sd * 0.3;

      if (live.current.style === "house") {
        if (live.current.soundOn) {
          if (s % 4 === 0) {
            kick(e, t);
            duck(e, t);
          }
          if (s === 0)
            playChord(e, t, ch, {
              vol: 0.085,
              dur: C.BEAT * 3.8,
              attack: 0.22,
              strum: 0.012,
              bright: 2000,
            });
          if (s === 4 || s === 12) clap(e, t);
          if (s % 4 === 2) {
            openHat(e, t);
            bassPluck(e, t, ch.notes[0] - 12, 0.2, 0.2);
          }
          if (s === 0)
            bassPluck(
              e,
              t,
              ch.notes[0] - 24 < 24 ? ch.notes[0] - 12 : ch.notes[0] - 24,
              0.3,
              0.18,
            );
          if (s % 2 === 0 && s % 4 !== 2) hat(e, t, s % 4 === 0 ? 0.03 : 0.06);
          if (live.current.streaks) {
            if (s % 2 === 1 && Math.random() < 0.22) roll(t, C.sd);
            if (s === 15 && bar % 2 === 1) roll(t, C.sd * 2);
          } else if (s % 2 === 1) hat(e, t, 0.045);
        }
        if (s === 0) vis(t, ch, true);
        else if (s % 4 === 0) vis(t, ch, false);
      } else {
        if (live.current.soundOn) {
          if (s === 0) {
            playChord(e, t, ch, {
              vol: 0.095,
              dur: C.BEAT * 3.7,
              attack: 0.4,
              strum: 0.02,
              bright: 1800,
            });
            bassPad(e, t, ch.notes[0] - 12, C.BEAT * 1.7);
            kick(e, t);
          }
          if (s === 3) kick(e, t, 0.55);
          if (s === 4) {
            clap(e, t);
            bassPad(e, t, ch.notes[0] - 12, C.BEAT * 1.5);
          }
          if (s === 6 && bar % 2 === 1) kick(e, t, 0.45);
          hat(e, t, s % 2 ? 0.045 : 0.085);
          if (live.current.streaks && s % 2 === 1 && Math.random() < 0.3)
            roll(t, C.sd);
        }
        if (s === 0) vis(t, ch, true);
        else if (s === 4) vis(t, ch, false);
      }
      live.current.nextTime += C.sd;
      live.current.stepIdx++;
    }
  }, [bpmOf, pulse, setAccent]);

  const startStop = useCallback(
    (force?: boolean) => {
      const e = ensure();
      if (!e) return;
      const want = force != null ? force : !live.current.playing;
      if (lookTimer.current) clearInterval(lookTimer.current);
      if (!want) {
        live.current.playing = false;
        setPlaying(false);
      } else {
        live.current.playing = true;
        live.current.stepIdx = 0;
        live.current.nextTime = e.ac.currentTime + 0.08;
        lookTimer.current = setInterval(scheduler, 25);
        setPlaying(true);
        setFace(live.current.style === "house" ? "ヾ(⌐■_■)ノ♪" : "\\(♥▿♥)♪");
      }
    },
    [ensure, scheduler],
  );

  const restartIfPlaying = useCallback(() => {
    if (live.current.playing) {
      startStop(false);
      startStop(true);
    }
  }, [startStop]);

  /* ---------- the abyss ---------- */

  const locrian = useCallback(() => {
    const e = ensure();
    if (!e) return;
    if (live.current.soundOn) {
      playChord(e, e.ac.currentTime + 0.02, LOCRIAN, {
        vol: 0.15,
        dur: 3,
        attack: 0.012,
        type: "square",
        bright: 3000,
        strum: 0.035,
      });
    }
    rootRef.current?.classList.add(styles.glitch);
    setFace("(☉︵☉)");
    setNow(`${LOCRIAN.name} · ${LOCRIAN.mood}`);
    energyRef.current = 1;
    if (fxRef.current)
      fxBurst(fxRef.current, innerWidth / 2, innerHeight * 0.4, 26);
    setTimeout(() => {
      rootRef.current?.classList.remove(styles.glitch);
      setFace("ヾ(⌐■_■)ノ♪");
    }, 950);
  }, [ensure]);

  /* ---------- state setters that keep the live mirror in sync ---------- */

  const applyStyle = useCallback(
    (v: "chill" | "house") => {
      live.current.style = v;
      setStyleMode(v);
      restartIfPlaying();
    },
    [restartIfPlaying],
  );

  const applySwing = useCallback((v: boolean) => {
    live.current.swing = v;
    setSwing(v);
  }, []);

  const applyStreaks = useCallback((v: boolean) => {
    live.current.streaks = v;
    setStreaks(v);
  }, []);

  const applyPal = useCallback(
    (i: number) => {
      live.current.curPal = i;
      live.current.progIdx = 0;
      setCurPal(i);
      setAccent(PAL[i].chords[0]);
    },
    [setAccent],
  );

  const applySound = useCallback(() => {
    const v = !live.current.soundOn;
    live.current.soundOn = v;
    setSoundOn(v);
    if (engineRef.current) engineRef.current.master.gain.value = v ? 0.75 : 0;
  }, []);

  /* ---------- one-shot helpers ---------- */

  const softPing = useCallback(
    (m: number, vol = 0.09) => {
      const e = ensure();
      if (!e || !live.current.soundOn) return;
      ping(e, m, e.ac.currentTime + 0.01, vol);
    },
    [ensure],
  );

  const giveAct = useCallback(
    (ev: React.MouseEvent) => {
      setGoText(ACTS[Math.floor(Math.random() * ACTS.length)]);
      setGoSmall(true);
      const chords = PAL[live.current.curPal].chords;
      strike(live.current.progIdx % chords.length, ev.clientX, ev.clientY);
      live.current.progIdx++;
      if (fxRef.current) fxBurst(fxRef.current, ev.clientX, ev.clientY, 14);
    },
    [strike],
  );

  const tamaBoop = useCallback(
    (ev: React.MouseEvent) => {
      const e = ensure();
      if (!e) return;
      if (live.current.soundOn) {
        [69, 72, 76, 79, 84].forEach((m, i) =>
          ping(e, m, e.ac.currentTime + 0.02 + i * 0.085, 0.1),
        );
      }
      const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
      if (fxRef.current)
        fxBurst(fxRef.current, r.left + r.width / 2, r.top + r.height / 2, 16);
      energyRef.current = 1;
      setFace("\\(♥▽♥)/♪");
      // poke the creature — it heals, that's the whole point
      tamaNcaRef.current?.damageCenter();
    },
    [ensure],
  );

  /* the tama IS a neural cellular automaton, if weights are shipped.
     Deferred to idle time — fetching weights and compiling the shader must
     never delay the first paint of the homepage. */
  useEffect(() => {
    const cv = tamaCvRef.current;
    if (!cv) return;
    let cancelled = false;
    let cycle: ReturnType<typeof setInterval> | null = null;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const boot = () => {
      fetchWeights()
        .then((data) => {
          if (cancelled || !data) return;
          const player = createPlayer(
            cv,
            () => {},
            () => {},
          );
          if (!player) return;
          const m = player.loadModel(data);
          if (!m) return;
          tamaNcaRef.current = player;
          player.params.speed = 2;
          player.setPlaying(true);
          setNcaAlive(true);
          // slow wander through its learned classes
          cycle = setInterval(() => {
            player.params.A = (player.params.A + 1) % m.N;
          }, 12_000);
        })
        .catch(() => {});
    };

    if ("requestIdleCallback" in window) {
      idleId = (window as any).requestIdleCallback(boot, { timeout: 6000 });
    } else {
      timerId = setTimeout(boot, 2500);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) (window as any).cancelIdleCallback?.(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
      if (cycle) clearInterval(cycle);
      tamaNcaRef.current?.destroy();
      tamaNcaRef.current = null;
    };
  }, []);

  /* ---------- the social heart: connect ---------- */

  const handleConnect = useCallback(
    (ev: React.FormEvent) => {
      ev.preventDefault();
      const f = from.trim();
      const t = to.trim();
      if (!f || !t) return;
      try {
        localStorage.setItem("ail:name", f);
      } catch {}
      const e = ensure();
      if (e && live.current.soundOn) {
        playChord(
          e,
          e.ac.currentTime + 0.02,
          PAL[live.current.curPal].chords[0],
          { vol: 0.13, dur: 2.4 },
        );
      }
      if (fxRef.current)
        fxBurst(fxRef.current, innerWidth / 2, innerHeight * 0.4, 20);
      const s = say.trim();
      const path = s
        ? `/from/${f}/to/${t}/say/${encodeURIComponent(s)}`
        : `/from/${f}/to/${t}`;
      startTransition(() => router.push(path));
    },
    [from, to, say, ensure, router],
  );

  const swapNames = useCallback(() => {
    setFrom(to);
    setTo(from);
  }, [from, to]);

  /* ---------- starfield ---------- */

  useEffect(() => {
    const cv = starsRef.current;
    if (!cv) return;
    const cx = cv.getContext("2d");
    if (!cx) return;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let CW = 0,
      CH = 0,
      raf = 0;
    type Star = { x: number; y: number; c: string; s: number; tw: number };
    let stars: Star[] = [];

    const spawn = (near: boolean): Star => {
      const a = Math.random() * Math.PI * 2;
      const r = near
        ? Math.random() * 40 + 5
        : Math.random() * Math.max(CW, CH) * 0.5;
      return {
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        c: STAR_COLS[Math.floor(Math.random() * STAR_COLS.length)],
        s: 0.8 + Math.random() * 1.8,
        tw: Math.random() * Math.PI * 2,
      };
    };

    const size = () => {
      CW = innerWidth;
      CH = innerHeight;
      cv.width = CW * DPR;
      cv.height = CH * DPR;
      cv.style.width = CW + "px";
      cv.style.height = CH + "px";
      cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    size();
    stars = Array.from({ length: 150 }, () => spawn(false));
    window.addEventListener("resize", size);

    const loop = () => {
      cx.clearRect(0, 0, CW, CH);
      const H0 = 0.0022 * (1 + 2.6 * energyRef.current); // Hubble-ish: v ∝ distance
      const ox = CW / 2,
        oy = CH * 0.42;
      for (let i = 0; i < stars.length; i++) {
        const st = stars[i];
        st.x += st.x * H0;
        st.y += st.y * H0;
        st.tw += 0.06;
        if (Math.abs(st.x) > CW * 0.62 || Math.abs(st.y) > CH * 0.62)
          stars[i] = spawn(true);
        const al = 0.32 + 0.18 * Math.sin(st.tw) + 0.25 * energyRef.current;
        cx.globalAlpha = Math.max(0.08, Math.min(0.75, al));
        cx.fillStyle = st.c;
        cx.beginPath();
        cx.arc(
          ox + st.x,
          oy + st.y,
          st.s * (1 + 0.6 * energyRef.current),
          0,
          6.2832,
        );
        cx.fill();
      }
      cx.globalAlpha = 1;
      energyRef.current *= 0.965;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  /* ---------- keyboard ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      )
        return;
      const k = e.key.toLowerCase();
      if (k >= "1" && k <= "5") strike(parseInt(k, 10) - 1);
      else if (k === "g") startStop();
      else if (k === "s")
        applyStyle(live.current.style === "chill" ? "house" : "chill");
      else if (k === "w") applySwing(!live.current.swing);
      else if (k === "h") applyStreaks(!live.current.streaks);
      else if (k === "l") locrian();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [strike, startStop, applyStyle, applySwing, applyStreaks, locrian]);

  /* legacy NextChat deep links are hash-routed (/#/chat, /#/settings…) —
     forward them to /chat so nobody's bookmark breaks */
  useEffect(() => {
    if (window.location.hash.startsWith("#/")) {
      window.location.replace("/chat" + window.location.hash);
    }
  }, []);

  /* set the opening chord's color as the world's accent */
  useEffect(() => {
    setAccent(PAL[0].chords[0]);
  }, [setAccent]);

  /* ---------- tamagotchi faces ---------- */

  useEffect(() => {
    let fi = 0;
    const id = setInterval(() => {
      fi = (fi + 1) % FACES.length;
      setFace(FACES[fi]);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  /* ---------- feed polling + presence ---------- */

  const feedRef = useRef(feed);
  feedRef.current = feed;

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch("/api/social/feed?count=30");
        const data = await res.json();
        if (data.events?.length) {
          const newest = data.events[0]?.ts ?? 0;
          const prev = feedRef.current[0]?.ts ?? 0;
          if (newest > prev) {
            // someone acted in love — let the universe feel it
            energyRef.current = Math.min(1, energyRef.current + 0.7);
            if (fxRef.current)
              fxBurst(fxRef.current, innerWidth / 2, innerHeight * 0.3, 10);
            softPing(88, 0.06);
          }
          setFeed(data.events);
        }
      } catch {}
    };
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [softPing]);

  useEffect(() => {
    const names = Array.from(
      new Set([
        ...feed.flatMap((ev) => [ev.from, ev.to]),
        ...trendingProfiles.map((p) => p.username),
      ]),
    )
      .filter(Boolean)
      .slice(0, 50);
    if (names.length === 0) return;
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(
          `/api/social/presence?users=${encodeURIComponent(names.join(","))}`,
        );
        const data = await res.json();
        if (!cancelled && data.online) setOnline(data.online);
      } catch {}
    };
    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [feed, trendingProfiles]);

  /* presence heartbeat — you're a star on the map too */
  useEffect(() => {
    let name: string | null = null;
    try {
      name = localStorage.getItem("ail:name");
      if (name) setFrom((v) => v || name!);
    } catch {}
    if (!name) return;
    const beat = () =>
      fetch("/api/social/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      }).catch(() => {});
    beat();
    const id = setInterval(beat, 120_000);
    return () => clearInterval(id);
  }, []);

  /* ---------- teardown ---------- */

  useEffect(() => {
    return () => {
      if (lookTimer.current) clearInterval(lookTimer.current);
      engineRef.current?.ac.close().catch(() => {});
    };
  }, []);

  /* ---------- ambient pointer FX ---------- */

  const onRootPointerMove = useCallback((e: React.PointerEvent) => {
    if (!matchMedia("(pointer:fine)").matches) return;
    const nowT = performance.now();
    if (nowT - trailLast.current < 36) return;
    trailLast.current = nowT;
    const host = fxRef.current;
    if (!host) return;
    const d = document.createElement("div");
    d.className = styles.trail;
    d.style.left = e.clientX + "px";
    d.style.top = e.clientY + "px";
    d.style.background = COLS[Math.floor(Math.random() * COLS.length)];
    host.appendChild(d);
    d.animate(
      [
        { opacity: 0.8, transform: "translate(-50%,-50%) scale(1)" },
        {
          opacity: 0,
          transform: "translate(-50%,-50%) scale(.2) translateY(10px)",
        },
      ],
      { duration: 520, easing: "ease-out" },
    ).onfinish = () => d.remove();
  }, []);

  const onRootClick = useCallback(
    (e: React.MouseEvent) => {
      ensure();
      if (
        (e.target as HTMLElement).closest("a,button,input,textarea,[data-fx]")
      )
        return;
      if (fxRef.current) fxBurst(fxRef.current, e.clientX, e.clientY, 6);
      softPing(76 + Math.floor(Math.random() * 7), 0.05);
    },
    [ensure, softPing],
  );

  /* ---------- render ---------- */

  const pal = PAL[curPal];
  const bpmLabel = `${styleMode === "house" ? pal.bpm || 122 : 76} BPM${swing ? " · swung" : ""}`;
  const onlineSet = new Set(online);
  const marqueeRow = MARQUEE.map((m, i) => (
    <span key={i}>
      {m}
      <i>{i % 3 === 2 ? "♥" : "♪"}</i>
    </span>
  ));

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${syne.variable} ${hanken.variable}`}
      onPointerMove={onRootPointerMove}
      onClick={onRootClick}
    >
      <canvas ref={starsRef} className={styles.stars} />
      <div className={styles.gridBg} />
      <div className={styles.aura} />
      <div ref={fxRef} aria-hidden="true" />

      {/* floating shapes */}
      <div
        className={`${styles.shape} ${styles.float}`}
        style={{ top: 118, left: "5%", ["--r" as any]: "-6deg" }}
      >
        <div className={styles.bCircle} />
      </div>
      <div
        className={`${styles.shape} ${styles.float} ${styles.d3}`}
        style={{ top: 300, right: "7%", ["--r" as any]: "8deg" }}
      >
        <div className={styles.bHalf} />
      </div>
      <div
        className={`${styles.shape} ${styles.spin}`}
        style={{ top: 600, left: "8%" }}
      >
        <div className={styles.bDots} />
      </div>
      <div
        className={`${styles.shape} ${styles.float} ${styles.d2}`}
        style={{ top: 200, right: "16%", ["--r" as any]: "4deg" }}
      >
        <div className={styles.bPill} />
      </div>
      <div
        className={`${styles.shape} ${styles.wig} ${styles.shapeClick}`}
        style={{ top: 440, right: "4%" }}
        title="???"
        data-fx
        onClick={locrian}
      >
        <div className={styles.bX}>✕</div>
      </div>

      <div className={styles.stage}>
        <div
          className={`${styles.top} ${styles.pop}`}
          style={{ animationDelay: ".05s" }}
        >
          <div className={styles.logo}>
            <span className="dot" />
            ACT&nbsp;IN&nbsp;LOVE
          </div>
          <nav className={styles.nav}>
            <Link href="/chat" className={`${styles.chip} ${styles.chipMint}`}>
              💬 chat
            </Link>
            <button
              className={styles.chip}
              onClick={() =>
                actsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }
            >
              the idea
            </button>
            <Link href="/dashboard" className={styles.chip}>
              dashboard
            </Link>
            <Link href="/conversations" className={styles.chip}>
              conversations
            </Link>
            <button
              className={`${styles.chip} ${soundOn ? "" : styles.chipOn}`}
              onClick={applySound}
            >
              ♪ sound: {soundOn ? "on" : "off"}
            </button>
          </nav>
        </div>

        <section className={styles.hero}>
          <span
            className={`${styles.eyebrow} ${styles.pop}`}
            style={{ animationDelay: ".12s" }}
          >
            ★ v4 · social universe ★
          </span>
          <h1 className={styles.word} ref={wordRef} data-fx>
            <b
              className={`w1 ${styles.pop}`}
              style={{ animationDelay: ".2s" }}
              onPointerEnter={() => softPing(69)}
              onPointerDown={(e) => {
                softPing(81, 0.1);
                if (fxRef.current)
                  fxRipple(fxRef.current, e.clientX, e.clientY, null, false);
              }}
            >
              ACT
            </b>
            <b
              className={`w2 ${styles.pop}`}
              style={{ animationDelay: ".32s" }}
              onPointerEnter={() => softPing(76)}
              onPointerDown={(e) => {
                softPing(88, 0.1);
                if (fxRef.current)
                  fxRipple(fxRef.current, e.clientX, e.clientY, null, false);
              }}
            >
              IN
            </b>
            <b
              className={`w3 ${styles.pop}`}
              style={{ animationDelay: ".44s" }}
              onPointerEnter={() => softPing(81)}
              onPointerDown={(e) => {
                softPing(93, 0.1);
                if (fxRef.current)
                  fxRipple(fxRef.current, e.clientX, e.clientY, null, false);
              }}
            >
              LO<span>♥</span>E
            </b>
          </h1>
          <p
            className={`${styles.tag} ${styles.pop}`}
            style={{ animationDelay: ".56s" }}
          >
            The universe expands.{" "}
            <mark>Love is how we catch the escaping stars.</mark>
          </p>
          <p
            className={`${styles.sub} ${styles.pop}`}
            style={{ animationDelay: ".64s" }}
          >
            Type two names, make them a page. Watch the constellation of
            everyone else doing the same.
          </p>

          {/* the social heart */}
          <div
            className={`${styles.connect} ${styles.pop}`}
            style={{ animationDelay: ".7s" }}
          >
            <form className={styles.connectCard} onSubmit={handleConnect}>
              <span className={styles.connectLabel}>make someone a page</span>
              <div className={styles.connectRow}>
                <input
                  className={styles.nameInput}
                  placeholder="from (you)"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className={styles.swapBtn}
                  onClick={swapNames}
                  title="swap names"
                >
                  ⇄
                </button>
                <input
                  className={styles.nameInput}
                  placeholder="to (them)"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {showSay && (
                <input
                  className={`${styles.nameInput} ${styles.sayInput}`}
                  placeholder="say something special…"
                  value={say}
                  onChange={(e) => setSay(e.target.value)}
                />
              )}
              <div className={styles.connectActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => setShowSay((v) => !v)}
                >
                  {showSay ? "✕ SAY" : "+ SAY SOMETHING"}
                </button>
                <button
                  type="submit"
                  className={styles.btn}
                  disabled={isPending || !from.trim() || !to.trim()}
                >
                  {isPending ? "SUMMONING…" : "MAKE THEIR PAGE →"}
                </button>
                <span className={styles.connectHint}>
                  it becomes a living page at /from/you/to/them — AI-built,
                  yours to share
                </span>
              </div>
            </form>
          </div>

          <div
            className={`${styles.ctaRow} ${styles.pop}`}
            style={{ animationDelay: ".74s" }}
          >
            <button
              className={styles.btn}
              onClick={giveAct}
              style={
                goSmall
                  ? { fontSize: 13, fontFamily: "var(--body)", fontWeight: 600 }
                  : undefined
              }
            >
              {goText}
            </button>
            <button
              className={`${styles.btn} ${styles.groove} ${playing ? "on" : ""}`}
              onClick={() => startStop()}
            >
              <span className="eq">
                <i />
                <i />
                <i />
              </span>
              <span>{playing ? "STOP" : "PLAY"}</span>
            </button>
          </div>
          <div
            className={`${styles.hint} ${styles.pop}`}
            style={{ animationDelay: ".8s" }}
          >
            <kbd>1</kbd>–<kbd>5</kbd> chords · <kbd>G</kbd> play · <kbd>S</kbd>{" "}
            chill/house · <kbd>W</kbd> swing · <kbd>H</kbd> hat streaks · the{" "}
            <b>✕</b> hides the abyss (<kbd>L</kbd>)
          </div>

          {/* the love organ */}
          <div
            className={`${styles.organ} ${styles.pop}`}
            style={{ animationDelay: ".86s" }}
            data-fx
          >
            <div className={styles.organH}>
              <div className="t">the love organ ♪</div>
              <div className={styles.now}>
                now: <b>{now}</b>
              </div>
            </div>
            <div className={styles.palettes}>
              {PAL.map((pl, i) => (
                <span
                  key={pl.id}
                  className={`${styles.pal} ${i === curPal ? "on" : ""}`}
                  onClick={() => applyPal(i)}
                >
                  {pl.label}
                  <span className="cr">{pl.cr}</span>
                </span>
              ))}
            </div>
            <div className={styles.transport}>
              <div className={styles.seg}>
                <button
                  className={styleMode === "chill" ? "on" : ""}
                  onClick={() => applyStyle("chill")}
                >
                  CHILL
                </button>
                <button
                  className={styleMode === "house" ? "on" : ""}
                  onClick={() => applyStyle("house")}
                >
                  HOUSE
                </button>
              </div>
              <button
                className={`${styles.chip} ${swing ? styles.chipOn : ""}`}
                onClick={() => applySwing(!swing)}
              >
                swing: {swing ? "on" : "off"}
              </button>
              <button
                className={`${styles.chip} ${streaks ? styles.chipOn : ""}`}
                onClick={() => applyStreaks(!streaks)}
              >
                hat streaks: {streaks ? "on" : "off"}
              </button>
              <span className={styles.bpm}>{bpmLabel}</span>
            </div>
            <div className={styles.pads}>
              {pal.chords.map((ch, i) => (
                <div
                  key={`${pal.id}-${ch.name}`}
                  className={styles.pad}
                  style={{ background: ch.bg }}
                  onPointerDown={(e) => {
                    const el = e.currentTarget;
                    el.classList.add(styles.hit);
                    setTimeout(() => el.classList.remove(styles.hit), 130);
                    strike(i, e.clientX, e.clientY);
                  }}
                >
                  <span className="key">{i + 1}</span>
                  <div className="mood">{ch.mood}</div>
                  <div className="ch">{ch.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div
        className={`${styles.marquee} ${styles.pop}`}
        style={{ animationDelay: ".92s" }}
      >
        <div className={styles.mqTrack}>
          {marqueeRow}
          {marqueeRow}
        </div>
      </div>

      <div className={styles.stage} style={{ paddingTop: 8 }}>
        {/* ── the social universe: who's acting in love right now ── */}
        <div className={styles.social}>
          <section
            className={`${styles.panel} ${styles.pop}`}
            style={{ animationDelay: ".15s" }}
          >
            <div className={styles.panelH}>
              <h3 className={styles.panelT}>the constellation log</h3>
              <span className={styles.liveBadge}>
                <span className={styles.liveDot} />
                live
              </span>
            </div>
            <div className={styles.feedList}>
              {feed.length === 0 && (
                <p className={styles.empty}>
                  quiet universe — be the first star. make someone a page ↑
                </p>
              )}
              {feed.map((ev, i) => (
                <article key={`${ev.ts}-${i}`} className={styles.feedItem}>
                  <span className={styles.feedIcon}>
                    {FEED_ICONS[ev.type] ?? "•"}
                  </span>
                  <div className={styles.feedBody}>
                    {ev.type === "response" ? (
                      <span className={styles.feedPlain}>
                        {ev.from} replied to {ev.to}
                        {onlineSet.has(ev.from) && (
                          <span
                            className={styles.onlineDot}
                            title="online now"
                          />
                        )}
                      </span>
                    ) : (
                      <Link
                        href={`/from/${ev.from}/to/${ev.to}`}
                        className={styles.feedLink}
                      >
                        {ev.from} → {ev.to}
                        {(onlineSet.has(ev.from) || onlineSet.has(ev.to)) && (
                          <span
                            className={styles.onlineDot}
                            title="online now"
                          />
                        )}
                      </Link>
                    )}
                    {ev.preview && (
                      <p className={styles.feedPreview}>
                        &ldquo;{ev.preview}&rdquo;
                      </p>
                    )}
                    <time className={styles.feedTime}>{reltime(ev.ts)}</time>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            className={`${styles.panel} ${styles.pop}`}
            style={{ animationDelay: ".27s" }}
          >
            <div className={styles.panelH}>
              <h3 className={styles.panelT}>gravity wells</h3>
            </div>

            {trendingPages.length > 0 && (
              <>
                <p className={styles.trendGroupLabel}>pages people orbit</p>
                <div className={styles.trendList}>
                  {trendingPages.map((p, i) => (
                    <Link
                      key={`${p.from}-${p.to}`}
                      href={`/from/${p.from}/to/${p.to}`}
                      className={styles.trendItem}
                    >
                      <span className={styles.trendRank}>{i + 1}</span>
                      <span className={styles.trendName}>
                        {p.from} → {p.to}
                      </span>
                      <span className={styles.trendScore}>
                        {Math.round(p.score)}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {trendingProfiles.length > 0 && (
              <>
                <p className={styles.trendGroupLabel}>brightest people</p>
                <div className={styles.trendList}>
                  {trendingProfiles.map((p, i) => (
                    <Link
                      key={p.username}
                      href={`/user/${p.username}`}
                      className={styles.trendItem}
                    >
                      <span className={styles.trendRank}>{i + 1}</span>
                      <span className={styles.trendName}>
                        {p.username}
                        {onlineSet.has(p.username) && (
                          <span
                            className={styles.onlineDot}
                            title="online now"
                          />
                        )}
                      </span>
                      <span className={styles.trendScore}>
                        {Math.round(p.score)}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {trendingPages.length === 0 && trendingProfiles.length === 0 && (
              <p className={styles.empty}>
                no gravity yet — every universe starts with two names
              </p>
            )}

            <div className={styles.tiles}>
              {[
                { href: "/chat", label: "💬 chat" },
                { href: "/nca/player", label: "🦠 nca" },
                { href: "/plan", label: "📝 plan" },
                { href: "/love", label: "💝 love" },
                { href: "/quant", label: "📈 quant" },
                { href: "/game", label: "🎮 game" },
                { href: "/4d", label: "🌀 4d" },
                { href: "/clipboard", label: "📋 clipboard" },
                { href: "/dashboard", label: "🏠 dashboard" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className={styles.chip}>
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ── the idea ── */}
        <section className={styles.acts} ref={actsRef}>
          <article
            className={`${styles.card} k1 ${styles.pop}`}
            style={{ animationDelay: ".2s" }}
            onPointerEnter={() => softPing(84, 0.05)}
          >
            <div className="num">01</div>
            <div className="ic">✋</div>
            <h3>Small &gt; grand</h3>
            <p>
              You don&apos;t need a gesture. You need a Tuesday. A text, a seat
              given up, a name remembered. Love compounds in tiny deposits.
            </p>
          </article>
          <article
            className={`${styles.card} k2 ${styles.pop}`}
            style={{ animationDelay: ".32s" }}
            onPointerEnter={() => softPing(88, 0.05)}
          >
            <div className="num">02</div>
            <div className="ic">⚡</div>
            <h3>On purpose</h3>
            <p>
              Accidental kindness is nice. Deliberate kindness is a practice.
              Pick one human today and aim at them gently.
            </p>
          </article>
          <article
            className={`${styles.card} k3 ${styles.pop}`}
            style={{ animationDelay: ".44s" }}
            onPointerEnter={() => softPing(91, 0.05)}
          >
            <div className="num">03</div>
            <div className="ic">↻</div>
            <h3>Pass it loud</h3>
            <p>
              An act seen is an act multiplied. Be unembarrassed about it. Soft
              heart, big volume — that&apos;s the whole brand.
            </p>
          </article>
        </section>

        <div
          className={`${styles.foot} ${styles.pop}`}
          style={{ animationDelay: ".2s" }}
          data-fx
        >
          <div>
            <b>Credits, with love.</b>
            <div className="small">
              Harmonic DNA borrowed from the greats — the dreamers, the
              gone-too-soon, the ones still glowing. Progressions can&apos;t be
              owned; devotion can&apos;t either.
            </div>
          </div>
          <button
            className={styles.chip}
            style={{ background: "var(--cream2)" }}
            onClick={() => {
              strike(
                Math.floor(
                  Math.random() * PAL[live.current.curPal].chords.length,
                ),
              );
              if (fxRef.current)
                fxBurst(fxRef.current, innerWidth / 2, innerHeight * 0.5, 28);
            }}
          >
            make a little noise ♥
          </button>
        </div>
      </div>

      <div className={styles.stamp}>
        tuned by <b>BLØB.haus</b> ✦ every connection matters
      </div>

      <div
        className={styles.tama}
        title="boop me — i drop now"
        data-fx
        onClick={tamaBoop}
      >
        <div className="egg">
          <div className="screen">
            <canvas
              ref={tamaCvRef}
              style={{
                display: ncaAlive ? "block" : "none",
                width: "100%",
                height: "100%",
                imageRendering: "pixelated",
                borderRadius: 8,
              }}
            />
            {!ncaAlive && face}
          </div>
          <div className="btns">
            <span className="pb" />
            <span className="pb" style={{ background: "var(--yellow)" }} />
            <span className="pb" />
          </div>
          <Link
            href="/nca/player"
            className="name"
            style={{ display: "block", textDecoration: "none" }}
            onClick={(e) => e.stopPropagation()}
            title="meet the real one — a living neural cellular automaton"
          >
            BLØB.haus →
          </Link>
        </div>
      </div>
    </div>
  );
}

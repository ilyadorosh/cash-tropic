// NpcMemory.ts — the city remembers.
//
// The design brief, verbatim: "Pick one NPC and make this complete first:
// meet them, influence them, see them again later, and discover that they
// remember and have changed. If that works, the city has a soul."
//
// This is that loop, for every character in /api/game/npcs: per-NPC episodic
// memory (meetings, topics, time) persisted in localStorage. Relationships
// are learned reinforcement, not a morality meter: showing up repeatedly is
// what changes how someone greets you.

export interface NpcMemory {
  meetCount: number;
  lastMet: number; // epoch ms
  topics: string[]; // last few dialogue nodes you explored together
  affinity: number; // grows by meeting; faster when you actually converse
}

const KEY = (id: string) => `npc-memory:${id}`;

const EMPTY: NpcMemory = {
  meetCount: 0,
  lastMet: 0,
  topics: [],
  affinity: 0,
};

export function loadNpcMemory(id: string): NpcMemory {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

function save(id: string, mem: NpcMemory) {
  try {
    localStorage.setItem(KEY(id), JSON.stringify(mem));
  } catch {
    // storage unavailable — the city forgets, but never crashes
  }
}

// A meeting happened (walked up, dialogue opened).
export function recordMeeting(id: string): NpcMemory {
  const mem = loadNpcMemory(id);
  mem.meetCount += 1;
  mem.affinity += 1;
  mem.lastMet = Date.now();
  save(id, mem);
  return mem;
}

// You explored a dialogue branch together — that's real conversation,
// worth more than standing nearby.
export function recordTopic(id: string, topic: string): NpcMemory {
  const mem = loadNpcMemory(id);
  const t = topic.trim().slice(0, 80);
  if (t && mem.topics[mem.topics.length - 1] !== t) {
    mem.topics.push(t);
    if (mem.topics.length > 5) mem.topics.shift();
    mem.affinity += 1;
    save(id, mem);
  }
  return mem;
}

export type AffinityStage = "stranger" | "known" | "acquaintance" | "friend";

export function stageOf(mem: NpcMemory): AffinityStage {
  if (mem.affinity >= 8) return "friend";
  if (mem.affinity >= 4) return "acquaintance";
  if (mem.meetCount >= 1) return "known";
  return "stranger";
}

// nameplate badge — visible change, discoverable from across the street
export function stageBadge(mem: NpcMemory): string {
  const stage = stageOf(mem);
  if (stage === "friend") return "❤ ";
  if (stage === "acquaintance") return "☺ ";
  if (stage === "known") return "· ";
  return "";
}

function humanizeSince(ms: number): string {
  const mins = (Date.now() - ms) / 60_000;
  if (mins < 10) return "gerade eben";
  if (mins < 120) return "vorhin";
  if (mins < 60 * 24) return "heute schon";
  if (mins < 60 * 24 * 3) return "vor ein paar Tagen";
  return "vor langer Zeit";
}

// The remembered greeting — prepended to the intro dialogue line when you
// meet again. Null on a first meeting: strangers don't reminisce.
export function greetingFor(mem: NpcMemory, playerAlias = "du"): string | null {
  if (mem.meetCount < 1) return null;
  const since = humanizeSince(mem.lastMet);
  const lastTopic = mem.topics[mem.topics.length - 1];
  const stage = stageOf(mem);
  const opener =
    stage === "friend"
      ? `Da bist ${playerAlias} ja wieder! (${mem.meetCount}. Mal, ${since})`
      : stage === "acquaintance"
        ? `Schön, dich wiederzusehen — das letzte Mal war ${since}.`
        : `Wir kennen uns doch… ${since}, oder?`;
  return lastTopic
    ? `${opener} Wir hatten über „${lastTopic}“ geredet.`
    : opener;
}

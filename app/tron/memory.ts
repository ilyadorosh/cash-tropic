// memory.ts — the retention loop. The Grid remembers you: match history
// lives in localStorage (instant) and is backed up to Postgres under the
// same anonymous id the chat backup uses, so your rival is the same rival
// on every device. History tunes the opponents (rubber-band difficulty)
// and feeds the voice ("you always cut left").

import { getAnonUserId } from "../utils/backup";
import type { OpponentTuning, TronState } from "./engine";

const PROFILE_KEY = "cash-tropic:tron-profile";

export interface TronProfile {
  games: number;
  wins: number;
  losses: number;
  totalSurvival: number;
  leftTurns: number;
  rightTurns: number;
  streak: number; // + player winning streak, - losing streak
}

const EMPTY: TronProfile = {
  games: 0,
  wins: 0,
  losses: 0,
  totalSurvival: 0,
  leftTurns: 0,
  rightTurns: 0,
  streak: 0,
};

export function loadProfile(): TronProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

/** winrate → opponent skill: beat them and they study you; lose and they ease off */
export function tuneOpponents(profile: TronProfile): OpponentTuning {
  const rate = profile.games > 0 ? profile.wins / profile.games : 0.5;
  const streakEdge = Math.max(-0.15, Math.min(0.15, profile.streak * 0.05));
  return {
    aggression: Math.min(0.9, Math.max(0.1, 0.2 + rate * 0.6 + streakEdge)),
    sight: Math.round(200 + rate * 420),
  };
}

export function recordMatch(
  state: TronState,
  profile: TronProfile,
): TronProfile {
  const won = state.playerScore > state.aiScore;
  const next: TronProfile = {
    games: profile.games + 1,
    wins: profile.wins + (won ? 1 : 0),
    losses: profile.losses + (won ? 0 : 1),
    totalSurvival: profile.totalSurvival + state.survival,
    leftTurns: profile.leftTurns + state.leftTurns,
    rightTurns: profile.rightTurns + state.rightTurns,
    streak: won
      ? Math.max(1, profile.streak + 1)
      : Math.min(-1, profile.streak - 1),
  };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch {
    // storage full/blocked — the Grid forgets, the game goes on
  }
  // best-effort cloud copy; never blocks the arena
  fetch("/api/tron/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: getAnonUserId(),
      won,
      playerScore: state.playerScore,
      aiScore: state.aiScore,
      rounds: state.round,
      survivalTicks: state.survival,
      turnBias: state.rightTurns - state.leftTurns,
    }),
  }).catch(() => {});
  return next;
}

/** one human-readable habit for the voice to needle you about */
export function playerHabit(profile: TronProfile): string {
  const total = profile.leftTurns + profile.rightTurns;
  if (total < 24) return "an unread program";
  const rightShare = profile.rightTurns / total;
  if (rightShare > 0.62) return "a rider who always breaks right";
  if (rightShare < 0.38) return "a rider who always breaks left";
  return "a balanced rider";
}

// voice.ts — VEX speaks. Canned lines answer instantly; the LLM (same
// /api/characterThink endpoint the city NPCs use) replaces them when it
// feels like it. Every call is fail-soft: no key, no net, no problem —
// the Grid still hums.

import type { TronProfile } from "./memory";
import { playerHabit } from "./memory";

export type VoiceMoment =
  | "matchStart"
  | "playerDerez"
  | "aiDerez"
  | "matchWon"
  | "matchLost";

const CANNED: Record<VoiceMoment, string[]> = {
  matchStart: [
    "The Grid. A digital frontier. Try to keep up, User.",
    "Three points. No mercy protocols loaded.",
    "Your wheels write your obituary, User.",
  ],
  playerDerez: [
    "Derezzed. Predictable trajectory, User.",
    "End of line for that run.",
    "You turned exactly where I knew you would.",
  ],
  aiDerez: [
    "Impossible. Recalibrating.",
    "A worthy sequence, User.",
    "That wall was not on my map.",
  ],
  matchWon: [
    "You fight for the User... wait. You ARE the User.",
    "Match yours. I am... updating my model of you.",
  ],
  matchLost: [
    "End of line, User.",
    "Your pattern is archived. Next match ends faster.",
  ],
};

export function cannedLine(moment: VoiceMoment): string {
  const pool = CANNED[moment];
  return pool[Math.floor(Math.random() * pool.length)];
}

/** ask the LLM for a sharper line; resolve with a canned one on any failure */
export async function speak(
  moment: VoiceMoment,
  profile: TronProfile,
  score: { player: number; ai: number },
): Promise<string> {
  const fallback = cannedLine(moment);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("/api/characterThink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        character: "VEX",
        systemPrompt:
          "You are VEX, a light-cycle program on the Grid — terse, elegant, a little menacing, never cruel. " +
          "Reply with ONE short line (max 14 words), no quotes, addressed to 'User'.",
        context:
          `Moment: ${moment}. Score User ${score.player} : ${score.ai} VEX. ` +
          `Lifetime: ${profile.wins}W/${profile.losses}L against this User, who is ${playerHabit(profile)}.`,
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    const data = await res.json();
    const line = typeof data?.response === "string" ? data.response.trim() : "";
    return line && line.length <= 120 ? line : fallback;
  } catch {
    return fallback;
  }
}

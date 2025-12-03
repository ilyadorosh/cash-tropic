import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Each step completion reveals one word
// Words are encrypted in Redis, decrypted only when requirements met

const STEP_REQUIREMENTS: Record<number, string[]> = {
  1: ["spiritual_1_rock_bottom"],
  2: ["spiritual_2_step1"],
  3: ["physics_1_intro", "spiritual_3_step2"], // Must do both!
  4: ["physics_2_entropy"],
  5: ["finance_1_compound"],
  6: ["health_1_sugar"],
  7: ["spiritual_7_humility"],
  8: ["make_amends_3"], // Must make amends to 3 NPCs
  9: ["spiritual_9_amends"],
  10: ["physics_3_energy", "finance_3_bitcoin"],
  11: ["spiritual_11_prayer"],
  12: ["spiritual_12_service", "help_other_player"], // Help someone else!
};

export async function GET(req: Request) {
  const redis = Redis.fromEnv();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const step = parseInt(searchParams.get("step") || "0");

  if (!userId || !step || step < 1 || step > 12) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Get player progress
  const progressRaw = await redis.get(`player:${userId}:progress`);
  const progress = progressRaw
    ? typeof progressRaw === "string"
      ? JSON.parse(progressRaw)
      : progressRaw
    : { completedMissions: [] };

  // Check requirements for this step
  const required = STEP_REQUIREMENTS[step] || [];
  const completed = progress.completedMissions || [];

  const missingReqs = required.filter((r) => !completed.includes(r));

  if (missingReqs.length > 0) {
    return NextResponse.json({
      unlocked: false,
      missing: missingReqs,
      hint: getHintForStep(step),
    });
  }

  // Unlock the word!
  // Words are stored encrypted, keyed to this specific game instance
  const encryptedWord = await redis.get(`treasure:word:${step}`);

  // Log discovery
  await redis.zadd("treasure:leaderboard", {
    score: Date.now(),
    member: `${userId}:step${step}`,
  });

  // Track which steps this user has unlocked
  await redis.sadd(`player:${userId}:treasure`, step);
  const unlockedSteps = await redis.smembers(`player:${userId}:treasure`);

  return NextResponse.json({
    unlocked: true,
    step,
    word: encryptedWord, // The actual seed word
    progress: `${unlockedSteps.length}/12 words found`,
    message:
      step === 12
        ? "🎉 Du hast alle 12 Worte!  Gib sie in eine Bitcoin Wallet ein."
        : `Wort ${step} gefunden! Weiter zum nächsten Schritt.`,
  });
}

function getHintForStep(step: number): string {
  const hints: Record<number, string> = {
    1: "Beginne deine Reise.  Gib zu, dass du Hilfe brauchst.",
    2: "Glaube an etwas Größeres als dich selbst.",
    3: "Lerne die Grundlagen der Physik.  Übergib dich.",
    4: "Verstehe Entropie - warum Dinge zerfallen.",
    5: "Zinseszins - die mächtigste Kraft.",
    6: "Zucker ist Gift. Lerne über deinen Körper.",
    7: "Demut.  Bitte um Hilfe.",
    8: "Mache Wiedergutmachung bei 3 NPCs.",
    9: "Entschuldige dich persönlich.",
    10: "Energie, Bitcoin, Thermodynamik - alles verbunden.",
    11: "Meditation und Gebet.",
    12: "Hilf einem anderen Spieler.  Dann ist der Kreis geschlossen.",
  };
  return hints[step] || "Setze deine Reise fort.";
}

// GET /api/game/load/[userId] - Load game state from PostgreSQL
import { NextResponse } from "next/server";
import { loadFullGameState } from "@/app/lib/drizzle";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const gameState = await loadFullGameState({ userId });

    if (!gameState) {
      return NextResponse.json(
        { error: "No save found for user", userId },
        { status: 404 },
      );
    }

    // Transform the data to match PlayerProgress interface
    const learningMap: Record<
      string,
      {
        level: number;
        xp: number;
        lessonsCompleted: string[];
        currentLesson: string | null;
        achievements: string[];
        quizScores: Record<string, number>;
      }
    > = {};

    for (const lp of gameState.learning) {
      learningMap[lp.subject] = {
        level: lp.level,
        xp: lp.xp,
        lessonsCompleted: lp.lessonsCompleted ?? [],
        currentLesson: lp.currentLesson,
        achievements: lp.achievements ?? [],
        quizScores: lp.quizScores ?? {},
      };
    }

    // Build relationships map
    const relationshipsMap: Record<string, number> = {};
    for (const rel of gameState.relationships) {
      relationshipsMap[rel.npcId] = rel.affection;
    }

    // Build completed missions list
    const completedMissions = gameState.missions
      .filter((m) => m.completed)
      .map((m) => m.missionId);

    // Build PlayerProgress-like response
    const progress = {
      userId,
      money: gameState.save.money,
      health: gameState.save.health,
      respect: gameState.save.respect,
      wantedLevel: gameState.save.wantedLevel,
      playTime: gameState.save.playTime,
      currentMission: gameState.save.currentMission,
      unlockedZones: gameState.save.unlockedZones ?? [],
      ownedProperties: gameState.save.ownedProperties ?? [],

      learning: {
        physics: learningMap.physics ?? createDefaultTrack(),
        math: learningMap.math ?? createDefaultTrack(),
        finance: learningMap.finance ?? createDefaultTrack(),
        health: learningMap.health ?? createDefaultTrack(),
        spiritual: learningMap.spiritual ?? createDefaultTrack(),
      },

      completedMissions,
      relationships: relationshipsMap,

      twelveSteps: gameState.twelveSteps
        ? {
            currentStep: gameState.twelveSteps.currentStep,
            stepsCompleted: gameState.twelveSteps.stepsCompleted ?? [],
            sobrietyDays: gameState.twelveSteps.sobrietyDays,
            sponsor: gameState.twelveSteps.sponsor,
            amends: gameState.twelveSteps.amends ?? [],
          }
        : {
            currentStep: 0,
            stepsCompleted: Array(12).fill(false),
            sobrietyDays: 0,
            sponsor: null,
            amends: [],
          },

      createdAt: gameState.save.createdAt.toISOString(),
      lastSaved: gameState.save.lastSaved.toISOString(),
    };

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Failed to load game:", error);
    return NextResponse.json({ error: "Failed to load game" }, { status: 500 });
  }
}

function createDefaultTrack() {
  return {
    level: 1,
    xp: 0,
    lessonsCompleted: [],
    currentLesson: null,
    achievements: [],
    quizScores: {},
  };
}

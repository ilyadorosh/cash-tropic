// POST /api/game/save - Save full game state to PostgreSQL
import { NextResponse } from "next/server";
import {
  getGameSaveByUserId,
  createGameSave,
  updateGameSave,
  upsertLearningProgress,
  completeMission,
  upsertTwelveStepsProgress,
  upsertNPCRelationship,
  addOwnedProperty,
  getOwnedPropertiesByGameSave,
} from "@/app/lib/drizzle";

interface LearningTrackData {
  level: number;
  xp: number;
  lessonsCompleted: string[];
  currentLesson: string | null;
  achievements: string[];
  quizScores: Record<string, number>;
}

interface SaveGameRequest {
  userId: string;
  money: number;
  health: number;
  respect: number;
  wantedLevel: number;
  playTime: number;
  currentMission: string | null;
  unlockedZones: string[];
  ownedProperties: string[];
  learning: {
    physics: LearningTrackData;
    math: LearningTrackData;
    finance: LearningTrackData;
    health: LearningTrackData;
    spiritual: LearningTrackData;
  };
  completedMissions: string[];
  relationships: Record<string, number>;
  twelveSteps: {
    currentStep: number;
    stepsCompleted: boolean[];
    sobrietyDays: number;
    sponsor: string | null;
    amends: string[];
  };
}

export async function POST(req: Request) {
  try {
    const data: SaveGameRequest = await req.json();

    if (!data.userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Check if save exists
    let save = await getGameSaveByUserId({ userId: data.userId });

    if (save) {
      // Update existing save
      save = await updateGameSave({
        id: save.id,
        money: data.money,
        health: data.health,
        respect: data.respect,
        wantedLevel: data.wantedLevel,
        playTime: data.playTime,
        currentMission: data.currentMission,
        unlockedZones: data.unlockedZones,
        ownedPropertiesList: data.ownedProperties,
      });
    } else {
      // Create new save
      save = await createGameSave({
        userId: data.userId,
        money: data.money,
        health: data.health,
        respect: data.respect,
        wantedLevel: data.wantedLevel,
        playTime: data.playTime,
        currentMission: data.currentMission ?? undefined,
        unlockedZones: data.unlockedZones,
        ownedPropertiesList: data.ownedProperties,
      });
    }

    // Save learning progress for each subject
    const subjects = [
      "physics",
      "math",
      "finance",
      "health",
      "spiritual",
    ] as const;
    for (const subject of subjects) {
      const track = data.learning[subject];
      if (track) {
        await upsertLearningProgress({
          gameSaveId: save.id,
          subject,
          level: track.level,
          xp: track.xp,
          lessonsCompleted: track.lessonsCompleted,
          currentLesson: track.currentLesson,
          achievements: track.achievements,
          quizScores: track.quizScores,
        });
      }
    }

    // Save completed missions
    for (const missionId of data.completedMissions) {
      await completeMission({ gameSaveId: save.id, missionId });
    }

    // Save twelve steps progress
    if (data.twelveSteps) {
      await upsertTwelveStepsProgress({
        gameSaveId: save.id,
        currentStep: data.twelveSteps.currentStep,
        stepsCompleted: data.twelveSteps.stepsCompleted,
        sobrietyDays: data.twelveSteps.sobrietyDays,
        sponsor: data.twelveSteps.sponsor,
        amends: data.twelveSteps.amends,
      });
    }

    // Save NPC relationships
    for (const [npcId, affection] of Object.entries(data.relationships)) {
      await upsertNPCRelationship({
        gameSaveId: save.id,
        npcId,
        affection,
      });
    }

    // Save owned properties (only new ones)
    const existingProperties = await getOwnedPropertiesByGameSave({
      gameSaveId: save.id,
    });
    const existingPropertyIds = new Set(
      existingProperties.map((p) => p.propertyId),
    );

    for (const propertyId of data.ownedProperties) {
      if (!existingPropertyIds.has(propertyId)) {
        await addOwnedProperty({
          gameSaveId: save.id,
          propertyId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      saveId: save.id,
      lastSaved: save.lastSaved,
    });
  } catch (error) {
    console.error("Failed to save game:", error);
    return NextResponse.json({ error: "Failed to save game" }, { status: 500 });
  }
}

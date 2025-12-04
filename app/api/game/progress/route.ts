// PATCH /api/game/progress - Update specific game progress
import { NextResponse } from "next/server";
import {
  getGameSaveByUserId,
  updateGameSave,
  upsertLearningProgress,
  completeMission,
  upsertTwelveStepsProgress,
  upsertNPCRelationship,
  addOwnedProperty,
} from "@/app/lib/drizzle";

interface ProgressUpdateRequest {
  userId: string;
  type:
    | "stats"
    | "learning"
    | "mission"
    | "twelveSteps"
    | "relationship"
    | "property";
  data: Record<string, unknown>;
}

export async function PATCH(req: Request) {
  try {
    const { userId, type, data }: ProgressUpdateRequest = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const save = await getGameSaveByUserId({ userId });
    if (!save) {
      return NextResponse.json(
        { error: "No save found for user" },
        { status: 404 },
      );
    }

    let result: unknown;

    switch (type) {
      case "stats":
        result = await updateGameSave({
          id: save.id,
          money: data.money as number | undefined,
          health: data.health as number | undefined,
          respect: data.respect as number | undefined,
          wantedLevel: data.wantedLevel as number | undefined,
          playTime: data.playTime as number | undefined,
          currentMission: data.currentMission as string | null | undefined,
          unlockedZones: data.unlockedZones as string[] | undefined,
          ownedPropertiesList: data.ownedProperties as string[] | undefined,
        });
        break;

      case "learning":
        result = await upsertLearningProgress({
          gameSaveId: save.id,
          subject: data.subject as string,
          level: data.level as number | undefined,
          xp: data.xp as number | undefined,
          lessonsCompleted: data.lessonsCompleted as string[] | undefined,
          currentLesson: data.currentLesson as string | null | undefined,
          achievements: data.achievements as string[] | undefined,
          quizScores: data.quizScores as Record<string, number> | undefined,
        });
        break;

      case "mission":
        result = await completeMission({
          gameSaveId: save.id,
          missionId: data.missionId as string,
        });
        break;

      case "twelveSteps":
        result = await upsertTwelveStepsProgress({
          gameSaveId: save.id,
          currentStep: data.currentStep as number | undefined,
          stepsCompleted: data.stepsCompleted as boolean[] | undefined,
          sobrietyDays: data.sobrietyDays as number | undefined,
          sponsor: data.sponsor as string | null | undefined,
          amends: data.amends as string[] | undefined,
        });
        break;

      case "relationship":
        result = await upsertNPCRelationship({
          gameSaveId: save.id,
          npcId: data.npcId as string,
          affection: data.affection as number | undefined,
          memories: data.memories as string[] | undefined,
        });
        break;

      case "property":
        result = await addOwnedProperty({
          gameSaveId: save.id,
          propertyId: data.propertyId as string,
          propertyName: data.propertyName as string | undefined,
          propertyType: data.propertyType as string | undefined,
          purchasePrice: data.purchasePrice as number | undefined,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid update type" },
          { status: 400 },
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Failed to update progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 },
    );
  }
}

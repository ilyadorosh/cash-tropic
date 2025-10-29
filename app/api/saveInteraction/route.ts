import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/drizzle";
import { contextInteractions } from "@/app/lib/schema";
import { saveContextInteraction } from "@/app/lib/drizzle";
// TODO: Import saveContextInteraction function once it's implemented in @/app/lib/drizzle

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originalPieceId, character, response, x, y } = body;

    // Save to your Drizzle DB
    const result = await saveContextInteraction({
      originalPieceId,
      character,
      response,
      x,
      y,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
    });
  } catch (error) {
    console.error("Error saving interaction:", error);
    return NextResponse.json(
      { error: "Failed to save interaction" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";

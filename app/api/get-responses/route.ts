import { NextRequest, NextResponse } from "next/server";
import { getUserResponses } from "@/app/lib/drizzle";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromUsername, toUsername } = body;

    if (!fromUsername || !toUsername) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const responses = await getUserResponses({
      fromUsername,
      toUsername,
    });

    return NextResponse.json({
      success: true,
      responses,
    });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch responses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";

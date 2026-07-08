import { NextRequest, NextResponse } from "next/server";
import { saveUserResponse } from "@/app/lib/drizzle";
import { trackResponse } from "@/app/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { fromUsername, toUsername, responseText } = body;

    if (!fromUsername || !toUsername || !responseText) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: { fromUsername, toUsername, responseText },
        },
        { status: 400 },
      );
    }

    fromUsername = fromUsername.trim();
    toUsername = toUsername.trim();
    responseText = responseText.trim();

    await Promise.all([
      saveUserResponse({ fromUsername, toUsername, responseText }),
      trackResponse(fromUsername, toUsername, responseText),
    ]);

    return NextResponse.json({
      success: true,
      message: "Response saved successfully",
    });
  } catch (error) {
    console.error("[Save Response] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";

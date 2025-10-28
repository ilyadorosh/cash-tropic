import { NextRequest, NextResponse } from "next/server";
import { saveUserResponse } from "@/app/lib/drizzle";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Save Response] Received body:", body); // Debug log

    let { fromUsername, toUsername, responseText } = body;

    // Log each field
    console.log("[Save Response] fromUsername:", fromUsername);
    console.log("[Save Response] toUsername:", toUsername);
    console.log("[Save Response] responseText:", responseText);

    // Validate input - check for empty strings too
    if (!fromUsername || !toUsername || !responseText) {
      console.error("[Save Response] Missing required fields:", {
        fromUsername: fromUsername ? "✓" : "✗",
        toUsername: toUsername ? "✓" : "✗",
        responseText: responseText ? "✓" : "✗",
      });
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: { fromUsername, toUsername, responseText },
        },
        { status: 400 },
      );
    }

    // Trim whitespace
    fromUsername = fromUsername.trim();
    toUsername = toUsername.trim();
    responseText = responseText.trim();

    console.log("[Save Response] Validated fields, saving...");

    const result = await saveUserResponse({
      fromUsername,
      toUsername,
      responseText,
    });

    console.log("[Save Response] Success:", result);

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

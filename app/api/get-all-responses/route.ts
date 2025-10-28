import { NextRequest, NextResponse } from "next/server";
import { userResponse, profile } from "@/app/lib/schema";
import { eq } from "drizzle-orm";
import { db } from "@/app/lib/drizzle"; // ✅ Import from drizzle.ts

export async function GET(req: NextRequest) {
  try {
    // Get all responses with profile info
    const allResponses = await db
      .select({
        id: userResponse.id,
        fromProfileId: userResponse.fromProfileId,
        toProfileId: userResponse.toProfileId,
        responseText: userResponse.responseText,
        createdAt: userResponse.createdAt,
        fromUsername: profile.username,
      })
      .from(userResponse)
      .leftJoin(profile, eq(userResponse.fromProfileId, profile.id))
      .orderBy(userResponse.createdAt);

    // Get profile names for the "to" side
    const conversationMap = new Map();

    for (const resp of allResponses) {
      const toProfile = await db
        .select()
        .from(profile)
        .where(eq(profile.id, resp.toProfileId))
        .limit(1);

      const key = `${resp.fromUsername}_${toProfile[0]?.username}`;

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          id: key,
          fromUsername: resp.fromUsername,
          toUsername: toProfile[0]?.username,
          responseCount: 0,
          lastResponseDate: resp.createdAt,
          latestResponse: resp.responseText,
        });
      }

      const conv = conversationMap.get(key);
      conv.responseCount += 1;
      conv.lastResponseDate = resp.createdAt;
      if (resp.responseText.length > 100) {
        conv.latestResponse = resp.responseText.substring(0, 100) + "...";
      } else {
        conv.latestResponse = resp.responseText;
      }
    }

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.lastResponseDate).getTime() -
        new Date(a.lastResponseDate).getTime(),
    );

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Error fetching all responses:", error);
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

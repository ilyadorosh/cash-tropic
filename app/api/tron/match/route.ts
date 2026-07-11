// /api/tron/match — the Grid's long-term memory, same anonymous-user
// pattern as the chat backup: ensureAnonUser then insert, no login needed.

import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, ensureAnonUser } from "@/app/lib/drizzle";
import { tronMatch } from "@/app/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      won,
      playerScore,
      aiScore,
      rounds,
      survivalTicks,
      turnBias,
    } = body ?? {};
    if (typeof userId !== "string" || typeof won !== "boolean") {
      return NextResponse.json(
        { error: "userId and won are required" },
        { status: 400 },
      );
    }
    await ensureAnonUser(userId);
    await db.insert(tronMatch).values({
      userId,
      won,
      playerScore: Number(playerScore) || 0,
      aiScore: Number(aiScore) || 0,
      rounds: Number(rounds) || 0,
      survivalTicks: Number(survivalTicks) || 0,
      turnBias: Number(turnBias) || 0,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[tron/match] save failed:", error);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }
    const matches = await db
      .select()
      .from(tronMatch)
      .where(eq(tronMatch.userId, userId))
      .orderBy(desc(tronMatch.createdAt))
      .limit(100);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("[tron/match] load failed:", error);
    return NextResponse.json({ error: "load failed" }, { status: 500 });
  }
}

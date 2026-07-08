import { NextRequest, NextResponse } from "next/server";
import { getConnectionStats, getProfileStats } from "@/app/lib/redis";

// GET /api/social/stats?from=alice&to=bob   — connection stats
// GET /api/social/stats?username=alice       — profile stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const username = searchParams.get("username");

  if (username) {
    const stats = await getProfileStats(username);
    return NextResponse.json({ username, ...stats });
  }

  if (from && to) {
    const stats = await getConnectionStats(from, to);
    return NextResponse.json({ from, to, ...stats });
  }

  return NextResponse.json(
    { error: "Provide username or from+to params" },
    { status: 400 },
  );
}

export const runtime = "nodejs";

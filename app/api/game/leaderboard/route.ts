// Leaderboard API using Redis sorted sets
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET(req: Request) {
  const redis = Redis.fromEnv();
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") || "physics";

  try {
    // Get top 10 from sorted set
    const leaderboard = await redis.zrange(`leaderboard:${subject}`, 0, 9, {
      rev: true,
      withScores: true,
    });
    return NextResponse.json({ leaderboard });
  } catch (error) {
    return NextResponse.json({ error: "Redis error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const redis = Redis.fromEnv();
  const { subject, userId, score } = await req.json();

  try {
    await redis.zadd(`leaderboard:${subject}`, { score, member: userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Redis error" }, { status: 500 });
  }
}

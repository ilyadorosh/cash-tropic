// City state persistence
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET(req: Request) {
  const redis = Redis.fromEnv();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "default";

  try {
    const cityData = await redis.get(`city:${userId}`);
    return NextResponse.json({ city: cityData });
  } catch (error) {
    return NextResponse.json({ error: "Redis error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const redis = Redis.fromEnv();
  const { userId, cityData } = await req.json();

  try {
    await redis.set(
      `city:${userId}`,
      JSON.stringify({
        ...cityData,
        updatedAt: new Date().toISOString(),
      }),
    );

    // Also update global stats
    await redis.hincrby(
      "game:stats",
      "totalBuildings",
      cityData.buildings?.length || 0,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Redis error" }, { status: 500 });
  }
}

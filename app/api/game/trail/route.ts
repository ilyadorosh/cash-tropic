import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const REDIS_KEY_PREFIX = "game:trail:";
const TRAIL_EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json({ trails: {} });
    }

    const kv = Redis.fromEnv();

    if (playerId) {
      // Get specific player trail
      const trail = await kv.get(`${REDIS_KEY_PREFIX}${playerId}`);
      return NextResponse.json({
        trails: trail ? { [playerId]: trail } : {},
      });
    } else {
      // Get all player trails (limited to recent ones)
      const keys = await kv.keys(`${REDIS_KEY_PREFIX}*`);
      const trails: Record<string, any> = {};

      for (const key of keys.slice(0, 50)) {
        // Limit to 50 trails
        const trail = await kv.get(key);
        const playerId = key.replace(REDIS_KEY_PREFIX, "");
        trails[playerId] = trail;
      }

      return NextResponse.json({ trails });
    }
  } catch (error) {
    console.error("Trail API GET error:", error);
    return NextResponse.json({ trails: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, points } = body;

    if (!playerId || !points) {
      return NextResponse.json(
        { error: "Missing playerId or points" },
        { status: 400 },
      );
    }

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json({
        success: false,
        note: "Redis not configured - trail not persisted",
      });
    }

    const kv = Redis.fromEnv();

    // Store trail with expiration (7 days)
    await kv.set(`${REDIS_KEY_PREFIX}${playerId}`, JSON.stringify(points), {
      ex: TRAIL_EXPIRATION_SECONDS,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trail API POST error:", error);
    return NextResponse.json(
      { error: "Failed to save trail" },
      { status: 500 },
    );
  }
}

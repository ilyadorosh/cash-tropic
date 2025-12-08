import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import type { PlayerTrace, TracePoint } from "@/app/game/types";

const REDIS_KEY_PREFIX = "game:traces";
const REDIS_LIST_KEY = "game:traces:list";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      // Return empty traces when Redis is not configured
      return NextResponse.json([]);
    }

    const kv = Redis.fromEnv();

    if (playerId) {
      // Get specific player's trace
      const trace = await kv.get<PlayerTrace>(
        `${REDIS_KEY_PREFIX}:${playerId}`,
      );
      return NextResponse.json(trace || null);
    }

    const limit = parseInt(searchParams.get("limit") || "50");

    // Get recent traces list
    const traceIds = await kv.lrange(REDIS_LIST_KEY, 0, limit - 1);

    if (!traceIds || traceIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all traces
    const traces: PlayerTrace[] = [];
    for (const id of traceIds) {
      const trace = await kv.get<PlayerTrace>(`${REDIS_KEY_PREFIX}:${id}`);
      if (trace) {
        traces.push(trace);
      }
    }

    return NextResponse.json(traces);
  } catch (error) {
    console.error("Traces API GET error:", error);
    // Return empty array on error for better DX
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { playerId, playerName, point, isHistorical } = body;

    if (!playerId || !point) {
      return NextResponse.json(
        { error: "playerId and point are required" },
        { status: 400 },
      );
    }

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      // Return success without saving when Redis is not configured
      return NextResponse.json({
        success: true,
        pointCount: 1,
        note: "Redis not configured - trace not persisted",
      });
    }

    const kv = Redis.fromEnv();

    const traceKey = `${REDIS_KEY_PREFIX}:${playerId}`;
    let trace = await kv.get<PlayerTrace>(traceKey);

    const newPoint: TracePoint = {
      x: point.x,
      y: point.y,
      timestamp: Date.now(),
    };

    if (!trace) {
      // Create new trace
      trace = {
        id: playerId,
        playerId,
        playerName: playerName || "Anonymous",
        points: [newPoint],
        startTime: Date.now(),
        isHistorical: isHistorical || false,
      };

      // Add to list of traces
      await kv.lpush(REDIS_LIST_KEY, playerId);
      await kv.ltrim(REDIS_LIST_KEY, 0, 99); // Keep last 100 traces
    } else {
      // Add point to existing trace
      trace.points.push(newPoint);

      // Keep only last 500 points per player to manage memory
      if (trace.points.length > 500) {
        trace.points = trace.points.slice(-500);
      }

      trace.endTime = Date.now();
    }

    await kv.set(traceKey, JSON.stringify(trace));
    // Set expiration for non-historical traces (24 hours)
    if (!isHistorical) {
      await kv.expire(traceKey, 86400);
    }

    return NextResponse.json({
      success: true,
      pointCount: trace.points.length,
    });
  } catch (error) {
    console.error("Traces API POST error:", error);
    return NextResponse.json(
      { error: "Failed to save trace" },
      { status: 500 },
    );
  }
}

// Delete player trace
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json(
        { error: "playerId is required" },
        { status: 400 },
      );
    }

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json({ success: true, note: "Redis not configured" });
    }

    const kv = Redis.fromEnv();
    await kv.del(`${REDIS_KEY_PREFIX}:${playerId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Traces API DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete trace" },
      { status: 500 },
    );
  }
}

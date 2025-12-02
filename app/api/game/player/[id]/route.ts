import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import type { PlayerState, Position } from "@/app/game/types";

const REDIS_KEY_PREFIX = "game:player";

const DEFAULT_PLAYER_STATE: Omit<PlayerState, "id" | "name"> = {
  position: { x: 1000, y: 1000 },
  health: 100,
  money: 100,
  xp: 0,
  level: 1,
  wantedLevel: 0,
  completedMissions: [],
  inventory: [],
  lastSaveTime: Date.now(),
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const playerId = params.id;

    // Return default state for new player if Redis is not configured
    const newPlayer: PlayerState = {
      id: playerId,
      name: `Player ${playerId.slice(0, 6)}`,
      ...DEFAULT_PLAYER_STATE,
    };

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json(newPlayer);
    }

    const kv = Redis.fromEnv();

    const playerState = await kv.get<PlayerState>(
      `${REDIS_KEY_PREFIX}:${playerId}`,
    );

    if (!playerState) {
      return NextResponse.json(newPlayer);
    }

    return NextResponse.json(playerState);
  } catch (error) {
    console.error("Player API GET error:", error);
    // Return default player state on error
    const playerId = params.id;
    const newPlayer: PlayerState = {
      id: playerId,
      name: `Player ${playerId.slice(0, 6)}`,
      ...DEFAULT_PLAYER_STATE,
    };
    return NextResponse.json(newPlayer);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const playerId = params.id;
    const body = await req.json();

    const baseState: PlayerState = {
      id: playerId,
      name: `Player ${playerId.slice(0, 6)}`,
      ...DEFAULT_PLAYER_STATE,
    };

    const updatedState: PlayerState = {
      ...baseState,
      ...body,
      id: playerId, // Ensure ID cannot be changed
      lastSaveTime: Date.now(),
    };

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json({
        success: true,
        data: updatedState,
        note: "Redis not configured - data not persisted",
      });
    }

    const kv = Redis.fromEnv();

    const existingState = await kv.get<PlayerState>(
      `${REDIS_KEY_PREFIX}:${playerId}`,
    );

    const finalState: PlayerState = {
      ...(existingState || baseState),
      ...body,
      id: playerId,
      lastSaveTime: Date.now(),
    };

    await kv.set(`${REDIS_KEY_PREFIX}:${playerId}`, JSON.stringify(finalState));

    return NextResponse.json({ success: true, data: finalState });
  } catch (error) {
    console.error("Player API POST error:", error);
    return NextResponse.json(
      { error: "Failed to save player data" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const playerId = params.id;

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
    console.error("Player API DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete player data" },
      { status: 500 },
    );
  }
}

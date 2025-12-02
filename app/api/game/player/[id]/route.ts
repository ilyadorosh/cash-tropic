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
    const kv = Redis.fromEnv();
    const playerId = params.id;

    const playerState = await kv.get<PlayerState>(
      `${REDIS_KEY_PREFIX}:${playerId}`,
    );

    if (!playerState) {
      // Return default state for new player
      const newPlayer: PlayerState = {
        id: playerId,
        name: `Player ${playerId.slice(0, 6)}`,
        ...DEFAULT_PLAYER_STATE,
      };
      return NextResponse.json(newPlayer);
    }

    return NextResponse.json(playerState);
  } catch (error) {
    console.error("Player API GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const kv = Redis.fromEnv();
    const playerId = params.id;
    const body = await req.json();

    const existingState =
      (await kv.get<PlayerState>(`${REDIS_KEY_PREFIX}:${playerId}`)) ||
      ({
        id: playerId,
        name: `Player ${playerId.slice(0, 6)}`,
        ...DEFAULT_PLAYER_STATE,
      } as PlayerState);

    const updatedState: PlayerState = {
      ...existingState,
      ...body,
      id: playerId, // Ensure ID cannot be changed
      lastSaveTime: Date.now(),
    };

    await kv.set(
      `${REDIS_KEY_PREFIX}:${playerId}`,
      JSON.stringify(updatedState),
    );

    return NextResponse.json({ success: true, data: updatedState });
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
    const kv = Redis.fromEnv();
    const playerId = params.id;

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

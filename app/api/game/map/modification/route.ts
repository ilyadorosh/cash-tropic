import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const REDIS_KEY_PREFIX = "game:map_mod:";

export interface MapModification {
  x: number;
  z: number;
  type: string;
  data: any;
  playerId: string;
  timestamp: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { x, z, type, data, playerId, timestamp } = body;

    if (x === undefined || z === undefined || !type || !playerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        note: "Redis not configured - modification not persisted",
      });
    }

    const kv = Redis.fromEnv();

    const modification: MapModification = {
      x,
      z,
      type,
      data,
      playerId,
      timestamp: timestamp || Date.now(),
    };

    // Store modification with grid key (10x10 grid cells)
    const gridX = Math.floor(x / 100);
    const gridZ = Math.floor(z / 100);
    const gridKey = `${REDIS_KEY_PREFIX}${gridX}_${gridZ}`;

    // Get existing modifications for this grid cell
    const existingMods = (await kv.get(gridKey)) || [];
    const mods = Array.isArray(existingMods) ? existingMods : [];

    // Add new modification
    mods.push(modification);

    // Keep only last 100 modifications per grid cell
    const trimmedMods = mods.slice(-100);

    // Store with 30 days expiration
    await kv.set(gridKey, JSON.stringify(trimmedMods), {
      ex: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true, modification });
  } catch (error) {
    console.error("Map modification API POST error:", error);
    return NextResponse.json(
      { error: "Failed to save modification" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gridX = searchParams.get("gridX");
    const gridZ = searchParams.get("gridZ");

    if (!gridX || !gridZ) {
      return NextResponse.json(
        { error: "Missing gridX or gridZ" },
        { status: 400 },
      );
    }

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json({ modifications: [] });
    }

    const kv = Redis.fromEnv();
    const gridKey = `${REDIS_KEY_PREFIX}${gridX}_${gridZ}`;
    const modifications = (await kv.get(gridKey)) || [];

    return NextResponse.json({
      modifications: Array.isArray(modifications) ? modifications : [],
    });
  } catch (error) {
    console.error("Map modification API GET error:", error);
    return NextResponse.json({ modifications: [] });
  }
}

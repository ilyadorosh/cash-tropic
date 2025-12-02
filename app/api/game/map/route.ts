import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import type { GameMap, Zone, Road, Position } from "@/app/game/types";

const REDIS_KEY = "game:map";

// Default map data for Nürnberg
const DEFAULT_MAP: GameMap = {
  id: "nuernberg-main",
  name: "Nürnberg",
  width: 2000,
  height: 2000,
  spawnPosition: { x: 1000, y: 1000 },
  zones: [
    {
      id: "zone-innenstadt",
      name: "Innenstadt",
      type: "innenstadt",
      bounds: { minX: 800, minY: 800, maxX: 1200, maxY: 1200 },
      color: "#4a5568",
      description: "The historic city center",
    },
    {
      id: "zone-suedstadt",
      name: "Südstadt",
      type: "suedstadt",
      bounds: { minX: 800, minY: 1200, maxX: 1200, maxY: 1600 },
      color: "#48bb78",
      description: "Southern residential area",
    },
    {
      id: "zone-gostenhof",
      name: "Gostenhof",
      type: "gostenhof",
      bounds: { minX: 400, minY: 800, maxX: 800, maxY: 1200 },
      color: "#ed8936",
      description: "Vibrant neighborhood with diverse culture",
    },
    {
      id: "zone-nordstadt",
      name: "Nordstadt",
      type: "nordstadt",
      bounds: { minX: 800, minY: 400, maxX: 1200, maxY: 800 },
      color: "#667eea",
      description: "Northern district",
    },
  ],
  roads: [
    {
      id: "road-hauptstrasse-1",
      type: "hauptstrasse",
      name: "Hauptstraße",
      width: 40,
      points: [
        { x: 200, y: 1000 },
        { x: 1800, y: 1000 },
      ],
    },
    {
      id: "road-autobahn-1",
      type: "autobahn",
      name: "A3 Autobahn",
      width: 60,
      points: [
        { x: 100, y: 100 },
        { x: 1900, y: 100 },
        { x: 1900, y: 1900 },
      ],
    },
    {
      id: "road-nebenstrasse-1",
      type: "nebenstrasse",
      name: "Seitenstraße",
      width: 20,
      points: [
        { x: 1000, y: 200 },
        { x: 1000, y: 1800 },
      ],
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export async function GET() {
  try {
    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json(DEFAULT_MAP);
    }

    const kv = Redis.fromEnv();
    const mapData = await kv.get<GameMap>(REDIS_KEY);

    if (!mapData) {
      // Return default map if none exists
      return NextResponse.json(DEFAULT_MAP);
    }

    return NextResponse.json(mapData);
  } catch (error) {
    console.error("Map API GET error:", error);
    // Return default on error for better DX
    return NextResponse.json(DEFAULT_MAP);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mapData: GameMap = {
      ...DEFAULT_MAP,
      ...body,
      updatedAt: Date.now(),
    };

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json({
        success: true,
        data: mapData,
        note: "Redis not configured - data not persisted",
      });
    }

    const kv = Redis.fromEnv();
    await kv.set(REDIS_KEY, JSON.stringify(mapData));

    return NextResponse.json({ success: true, data: mapData });
  } catch (error) {
    console.error("Map API POST error:", error);
    return NextResponse.json(
      { error: "Failed to save map data" },
      { status: 500 },
    );
  }
}

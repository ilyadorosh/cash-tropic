import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import type { Building } from "@/app/game/types";

const REDIS_KEY = "game:buildings";

// Default buildings for Nürnberg
const DEFAULT_BUILDINGS: Building[] = [
  {
    id: "building-schuckert-factory",
    type: "factory",
    name: "Schuckert & Co. Factory",
    description:
      "Historical electrical equipment factory founded by Sigmund Schuckert",
    position: { x: 600, y: 900 },
    width: 120,
    height: 80,
    color: "#718096",
    interactable: true,
  },
  {
    id: "building-siemens",
    type: "factory",
    name: "Siemens Energy",
    description: "Transformer factory, industrial heritage of Nürnberg",
    position: { x: 500, y: 700 },
    width: 150,
    height: 100,
    color: "#2d3748",
    interactable: true,
  },
  {
    id: "building-durer-house",
    type: "museum",
    name: "Dürer House",
    description: "Home of the famous artist Albrecht Dürer",
    position: { x: 950, y: 850 },
    width: 60,
    height: 50,
    color: "#dd6b20",
    interactable: true,
  },
  {
    id: "building-frauenkirche",
    type: "church",
    name: "Frauenkirche",
    description: "Gothic church in the main market square",
    position: { x: 1000, y: 1000 },
    width: 80,
    height: 100,
    color: "#9f7aea",
    interactable: true,
  },
  {
    id: "building-henlein-workshop",
    type: "historical",
    name: "Henlein Watch Workshop",
    description:
      "Where Peter Henlein invented the first pocket watch (Taschenuhr)",
    position: { x: 1100, y: 950 },
    width: 50,
    height: 40,
    color: "#d69e2e",
    interactable: true,
  },
  {
    id: "building-hospital",
    type: "hospital",
    name: "Klinikum Nürnberg",
    description: "Main hospital for health missions",
    position: { x: 1300, y: 600 },
    width: 100,
    height: 80,
    color: "#fc8181",
    interactable: true,
  },
  {
    id: "building-aa-meeting",
    type: "office",
    name: "Recovery Center",
    description: "12 Steps spiritual recovery meetings",
    position: { x: 850, y: 1100 },
    width: 60,
    height: 50,
    color: "#68d391",
    interactable: true,
  },
];

export async function GET() {
  try {
    const kv = Redis.fromEnv();
    const buildings = await kv.get<Building[]>(REDIS_KEY);

    if (!buildings) {
      return NextResponse.json(DEFAULT_BUILDINGS);
    }

    return NextResponse.json(buildings);
  } catch (error) {
    console.error("Buildings API GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch buildings" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const kv = Redis.fromEnv();
    const body = await req.json();

    let buildings: Building[];

    if (Array.isArray(body)) {
      buildings = body;
    } else if (body.building) {
      // Add single building to existing
      const existing = (await kv.get<Building[]>(REDIS_KEY)) || [];
      buildings = [...existing, body.building];
    } else {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    await kv.set(REDIS_KEY, JSON.stringify(buildings));

    return NextResponse.json({ success: true, data: buildings });
  } catch (error) {
    console.error("Buildings API POST error:", error);
    return NextResponse.json(
      { error: "Failed to save buildings" },
      { status: 500 },
    );
  }
}

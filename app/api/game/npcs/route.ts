import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import type { NPC, NPCDialogue } from "@/app/game/types";

const REDIS_KEY = "game:npcs";

// Default NPCs including historical figures
const DEFAULT_NPCS: NPC[] = [
  {
    id: "npc-schuckert",
    name: "Sigmund Schuckert",
    position: { x: 620, y: 920 },
    personality: "Innovative electrical pioneer, passionate about technology",
    isHistorical: true,
    color: "#f6e05e",
    dialogues: [
      {
        id: "schuckert-intro",
        text: "Guten Tag! I am Sigmund Schuckert. Electricity will change the world, my friend!",
        responses: [
          {
            text: "Tell me about your factory",
            nextDialogueId: "schuckert-factory",
          },
          {
            text: "How does electricity work?",
            nextDialogueId: "schuckert-physics",
          },
        ],
      },
      {
        id: "schuckert-factory",
        text: "Schuckert & Co. builds electrical equipment for all of Germany. We employ hundreds of workers!",
      },
      {
        id: "schuckert-physics",
        text: "Electricity flows like water through wires. Voltage is the pressure, current is the flow. Understanding this is the key to the future!",
      },
    ],
  },
  {
    id: "npc-henlein",
    name: "Peter Henlein",
    position: { x: 1120, y: 970 },
    personality: "Meticulous clockmaker, inventor of the pocket watch",
    isHistorical: true,
    color: "#d69e2e",
    dialogues: [
      {
        id: "henlein-intro",
        text: "Greetings, traveler. Time is precious - that's why I created the Taschenuhr, the pocket watch!",
        responses: [
          {
            text: "How did you invent the pocket watch?",
            nextDialogueId: "henlein-invention",
          },
          {
            text: "Tell me about time management",
            nextDialogueId: "henlein-time",
          },
        ],
      },
      {
        id: "henlein-invention",
        text: "I replaced the heavy weights with a coiled spring. The mainspring stores energy and releases it slowly. Physics in your pocket!",
      },
      {
        id: "henlein-time",
        text: "Time well spent is life well lived. Track your hours, invest them wisely, and you shall prosper.",
      },
    ],
  },
  {
    id: "npc-durer",
    name: "Albrecht Dürer",
    position: { x: 970, y: 870 },
    personality: "Renaissance artist and mathematician",
    isHistorical: true,
    color: "#ed8936",
    dialogues: [
      {
        id: "durer-intro",
        text: "Welcome to my house! Art and mathematics are two sides of the same coin.",
        responses: [
          {
            text: "Show me your art",
            nextDialogueId: "durer-art",
          },
          {
            text: "Tell me about perspective",
            nextDialogueId: "durer-math",
          },
        ],
      },
      {
        id: "durer-art",
        text: "My woodcuts and engravings capture nature's beauty. 'Melencolia I' shows the struggle of the creative mind.",
      },
      {
        id: "durer-math",
        text: "Perspective follows mathematical laws. Vanishing points, proportions - geometry is the foundation of visual truth!",
      },
    ],
  },
  {
    id: "npc-sponsor",
    name: "Recovery Sponsor",
    position: { x: 870, y: 1120 },
    personality: "Wise, supportive, experienced in 12-step recovery",
    isHistorical: false,
    color: "#68d391",
    dialogues: [
      {
        id: "sponsor-intro",
        text: "Welcome, friend. The 12 steps are a journey of healing. Are you ready to begin?",
        responses: [
          {
            text: "What is Step 1?",
            nextDialogueId: "sponsor-step1",
          },
          {
            text: "I need help",
            nextDialogueId: "sponsor-help",
          },
        ],
      },
      {
        id: "sponsor-step1",
        text: "Step 1: We admitted we were powerless over our addiction - that our lives had become unmanageable. Acceptance is the first step.",
      },
      {
        id: "sponsor-help",
        text: "You're not alone. One day at a time. Let's work through this together.",
      },
    ],
  },
  {
    id: "npc-doctor",
    name: "Dr. Weber",
    position: { x: 1320, y: 620 },
    personality: "Caring physician focused on preventive health",
    isHistorical: false,
    color: "#fc8181",
    dialogues: [
      {
        id: "doctor-intro",
        text: "Hello! Prevention is better than cure. What health topic interests you?",
        responses: [
          {
            text: "Tell me about nutrition",
            nextDialogueId: "doctor-nutrition",
          },
          {
            text: "How does the heart work?",
            nextDialogueId: "doctor-heart",
          },
        ],
      },
      {
        id: "doctor-nutrition",
        text: "Your body is like a machine - feed it quality fuel! Proteins build muscle, carbs provide energy, fats protect organs.",
      },
      {
        id: "doctor-heart",
        text: "The heart pumps 5 liters of blood per minute! Blood pressure, heart rate - understanding these keeps you healthy.",
      },
    ],
  },
];

export async function GET() {
  try {
    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json(DEFAULT_NPCS);
    }

    const kv = Redis.fromEnv();
    const npcs = await kv.get<NPC[]>(REDIS_KEY);

    if (!npcs) {
      return NextResponse.json(DEFAULT_NPCS);
    }

    return NextResponse.json(npcs);
  } catch (error) {
    console.error("NPCs API GET error:", error);
    // Return default on error for better DX
    return NextResponse.json(DEFAULT_NPCS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let npcs: NPC[];

    if (Array.isArray(body)) {
      npcs = body;
    } else if (body.npc) {
      npcs = [body.npc];
    } else {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Check if Redis env vars are available
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return NextResponse.json({
        success: true,
        data: npcs,
        note: "Redis not configured - data not persisted",
      });
    }

    const kv = Redis.fromEnv();

    if (body.npc) {
      const existing = (await kv.get<NPC[]>(REDIS_KEY)) || [];
      npcs = [...existing, body.npc];
    }

    await kv.set(REDIS_KEY, JSON.stringify(npcs));

    return NextResponse.json({ success: true, data: npcs });
  } catch (error) {
    console.error("NPCs API POST error:", error);
    return NextResponse.json({ error: "Failed to save NPCs" }, { status: 500 });
  }
}

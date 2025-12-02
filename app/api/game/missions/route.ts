import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import type { Mission, MissionCategory } from "@/app/game/types";

const REDIS_KEY = "game:missions";

// Default missions covering physics, finance, health, and spiritual (12 steps)
const DEFAULT_MISSIONS: Mission[] = [
  // Physics Missions
  {
    id: "mission-physics-electricity",
    title: "The Power of Electricity",
    description: "Visit Sigmund Schuckert and learn about electrical circuits",
    category: "physics",
    objectives: [
      {
        id: "obj-visit-schuckert",
        description: "Talk to Sigmund Schuckert at his factory",
        completed: false,
        targetNpcId: "npc-schuckert",
      },
      {
        id: "obj-learn-ohm",
        description: "Learn about Ohm's Law (V = IR)",
        completed: false,
      },
    ],
    reward: { xp: 100, money: 50 },
    unlocked: true,
    completed: false,
    startPosition: { x: 600, y: 900 },
  },
  {
    id: "mission-physics-time",
    title: "The Mechanics of Time",
    description: "Visit Peter Henlein and understand clockwork mechanics",
    category: "physics",
    objectives: [
      {
        id: "obj-visit-henlein",
        description: "Meet Peter Henlein at his workshop",
        completed: false,
        targetNpcId: "npc-henlein",
      },
      {
        id: "obj-understand-springs",
        description: "Learn how mainsprings store potential energy",
        completed: false,
      },
    ],
    reward: { xp: 100, money: 50 },
    prerequisites: ["mission-physics-electricity"],
    unlocked: false,
    completed: false,
    startPosition: { x: 1100, y: 950 },
  },
  // Finance Missions
  {
    id: "mission-finance-basics",
    title: "Financial Foundations",
    description: "Learn the basics of managing money",
    category: "finance",
    objectives: [
      {
        id: "obj-budget",
        description: "Create a basic budget",
        completed: false,
      },
      {
        id: "obj-savings",
        description: "Understand the concept of saving",
        completed: false,
      },
    ],
    reward: { xp: 75, money: 100 },
    unlocked: true,
    completed: false,
  },
  {
    id: "mission-finance-compound",
    title: "The Magic of Compound Interest",
    description: "Learn how money grows over time",
    category: "finance",
    objectives: [
      {
        id: "obj-compound-formula",
        description: "Understand A = P(1 + r/n)^(nt)",
        completed: false,
      },
      {
        id: "obj-invest",
        description: "Make your first investment",
        completed: false,
      },
    ],
    reward: { xp: 150, money: 200 },
    prerequisites: ["mission-finance-basics"],
    unlocked: false,
    completed: false,
  },
  // Health Missions
  {
    id: "mission-health-checkup",
    title: "Know Your Body",
    description: "Visit Dr. Weber for a health checkup",
    category: "health",
    objectives: [
      {
        id: "obj-visit-doctor",
        description: "Talk to Dr. Weber at the hospital",
        completed: false,
        targetNpcId: "npc-doctor",
      },
      {
        id: "obj-learn-vitals",
        description: "Learn about blood pressure and heart rate",
        completed: false,
      },
    ],
    reward: { xp: 75 },
    unlocked: true,
    completed: false,
    startPosition: { x: 1300, y: 600 },
  },
  // 12 Steps Spiritual Missions
  {
    id: "mission-step-1",
    title: "Step 1: Powerlessness",
    description:
      "Admit we were powerless over our addiction - that our lives had become unmanageable",
    category: "spiritual",
    stepNumber: 1,
    objectives: [
      {
        id: "obj-meet-sponsor",
        description: "Meet your sponsor at the Recovery Center",
        completed: false,
        targetNpcId: "npc-sponsor",
      },
      {
        id: "obj-acknowledge",
        description: "Acknowledge the problem",
        completed: false,
      },
    ],
    reward: { xp: 50 },
    unlocked: true,
    completed: false,
    startPosition: { x: 850, y: 1100 },
  },
  {
    id: "mission-step-2",
    title: "Step 2: Hope",
    description:
      "Came to believe that a Power greater than ourselves could restore us to sanity",
    category: "spiritual",
    stepNumber: 2,
    objectives: [
      {
        id: "obj-find-hope",
        description: "Find a source of hope",
        completed: false,
      },
      {
        id: "obj-believe",
        description: "Begin to believe in recovery",
        completed: false,
      },
    ],
    reward: { xp: 50 },
    prerequisites: ["mission-step-1"],
    unlocked: false,
    completed: false,
  },
  {
    id: "mission-step-3",
    title: "Step 3: Decision",
    description:
      "Made a decision to turn our will and our lives over to the care of God as we understood Him",
    category: "spiritual",
    stepNumber: 3,
    objectives: [
      {
        id: "obj-decide",
        description: "Make the decision to change",
        completed: false,
      },
    ],
    reward: { xp: 50 },
    prerequisites: ["mission-step-2"],
    unlocked: false,
    completed: false,
  },
  // Continue steps 4-12 in similar pattern
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `mission-step-${i + 4}`,
    title: `Step ${i + 4}`,
    description: `Continue the 12-step journey - Step ${i + 4}`,
    category: "spiritual" as MissionCategory,
    stepNumber: i + 4,
    objectives: [
      {
        id: `obj-step-${i + 4}`,
        description: `Complete Step ${i + 4}`,
        completed: false,
      },
    ],
    reward: { xp: 50 },
    prerequisites: [`mission-step-${i + 3}`],
    unlocked: false,
    completed: false,
  })),
  // Historical Mission
  {
    id: "mission-historical-tour",
    title: "Historical Nürnberg Tour",
    description:
      "Visit all historical landmarks and learn about the city's past",
    category: "historical" as MissionCategory,
    objectives: [
      {
        id: "obj-visit-durer",
        description: "Visit the Dürer House",
        completed: false,
        targetBuildingId: "building-durer-house",
      },
      {
        id: "obj-visit-church",
        description: "Visit the Frauenkirche",
        completed: false,
        targetBuildingId: "building-frauenkirche",
      },
    ],
    reward: { xp: 200, money: 100 },
    unlocked: true,
    completed: false,
  },
];

export async function GET() {
  try {
    const kv = Redis.fromEnv();
    const missions = await kv.get<Mission[]>(REDIS_KEY);

    if (!missions) {
      return NextResponse.json(DEFAULT_MISSIONS);
    }

    return NextResponse.json(missions);
  } catch (error) {
    console.error("Missions API GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch missions" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const kv = Redis.fromEnv();
    const body = await req.json();

    let missions: Mission[];

    if (Array.isArray(body)) {
      missions = body;
    } else if (body.mission) {
      const existing = (await kv.get<Mission[]>(REDIS_KEY)) || [];
      missions = [...existing, body.mission];
    } else if (body.update) {
      // Update a specific mission
      const existing = (await kv.get<Mission[]>(REDIS_KEY)) || DEFAULT_MISSIONS;
      missions = existing.map((m) =>
        m.id === body.update.id ? { ...m, ...body.update } : m,
      );
    } else {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    await kv.set(REDIS_KEY, JSON.stringify(missions));

    return NextResponse.json({ success: true, data: missions });
  } catch (error) {
    console.error("Missions API POST error:", error);
    return NextResponse.json(
      { error: "Failed to save missions" },
      { status: 500 },
    );
  }
}

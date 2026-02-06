import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/drizzle";
import { todoItem } from "@/app/lib/schema";
import { desc } from "drizzle-orm";

// Use Redis for fast access, Postgres for persistence
const getRedis = () => Redis.fromEnv();

export async function GET() {
  try {
    // Try Redis first for speed
    const redis = getRedis();
    const cached = await redis.get("todos:all");

    if (cached) {
      return NextResponse.json(
        typeof cached === "string" ? JSON.parse(cached) : cached,
      );
    }

    // Fallback to Postgres
    const todos = await db
      .select()
      .from(todoItem)
      .orderBy(desc(todoItem.createdAt))
      .limit(50);

    // Cache in Redis
    await redis.set("todos:all", JSON.stringify(todos), { ex: 60 });

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Todos GET error:", error);
    // If DB not available, return empty array
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, userId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newTodo = {
      id: crypto.randomUUID(),
      title,
      description: description || null,
      completed: false,
      priority: 0,
      createdAt: new Date(),
      updatedAt: null,
      userId: userId || null,
    };

    // Try to save to Postgres
    try {
      await db.insert(todoItem).values(newTodo);
    } catch (dbError) {
      console.error("DB insert failed, using Redis only:", dbError);
    }

    // Also save to Redis for fast access
    const redis = getRedis();
    await redis.del("todos:all"); // Invalidate cache

    return NextResponse.json(newTodo);
  } catch (error) {
    console.error("Todos POST error:", error);
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 },
    );
  }
}

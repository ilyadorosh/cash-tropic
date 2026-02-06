import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/drizzle";
import { textSnippet } from "@/app/lib/schema";
import { desc, eq } from "drizzle-orm";

const getRedis = () => Redis.fromEnv();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const pinnedOnly = searchParams.get("pinned") === "true";

    // Try Redis cache first
    const redis = getRedis();
    const cacheKey = `snippets:${userId || "all"}:${pinnedOnly}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return NextResponse.json(
        typeof cached === "string" ? JSON.parse(cached) : cached,
      );
    }

    // Query Postgres
    let query = db.select().from(textSnippet);

    if (userId) {
      query = query.where(eq(textSnippet.userId, userId)) as typeof query;
    }
    if (pinnedOnly) {
      query = query.where(eq(textSnippet.pinned, true)) as typeof query;
    }

    const snippets = await query
      .orderBy(desc(textSnippet.createdAt))
      .limit(100);

    // Cache for 30 seconds
    await redis.set(cacheKey, JSON.stringify(snippets), { ex: 30 });

    return NextResponse.json(snippets);
  } catch (error) {
    console.error("Snippets GET error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, title, tags, userId, pinned } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    const newSnippet = {
      id: crypto.randomUUID(),
      content,
      title: title || null,
      tags: tags ? JSON.stringify(tags) : null,
      userId: userId || null,
      pinned: pinned || false,
      createdAt: new Date(),
      updatedAt: null,
    };

    // Save to Postgres
    try {
      await db.insert(textSnippet).values(newSnippet);
    } catch (dbError) {
      console.error("DB insert failed:", dbError);
    }

    // Also sync to Redis clipboard history
    const redis = getRedis();
    await redis.lpush(
      "clipboard:all",
      JSON.stringify({
        content: newSnippet.content,
        timestamp: newSnippet.createdAt.toISOString(),
        id: newSnippet.id,
        title: newSnippet.title,
        pinned: newSnippet.pinned,
      }),
    );

    // Invalidate snippet cache
    await redis.del("snippets:all:false");
    await redis.del("snippets:all:true");

    return NextResponse.json(newSnippet);
  } catch (error) {
    console.error("Snippets POST error:", error);
    return NextResponse.json(
      { error: "Failed to create snippet" },
      { status: 500 },
    );
  }
}

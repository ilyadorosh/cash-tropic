import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/drizzle";
import { textSnippet } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

const getRedis = () => Redis.fromEnv();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [snippet] = await db
      .select()
      .from(textSnippet)
      .where(eq(textSnippet.id, id))
      .limit(1);

    if (!snippet) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    return NextResponse.json(snippet);
  } catch (error) {
    console.error("Snippet GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippet" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.content !== undefined) updates.content = body.content;
    if (body.title !== undefined) updates.title = body.title;
    if (body.tags !== undefined)
      updates.tags = body.tags ? JSON.stringify(body.tags) : null;
    if (body.pinned !== undefined) updates.pinned = body.pinned;

    await db.update(textSnippet).set(updates).where(eq(textSnippet.id, id));

    // Invalidate caches
    const redis = getRedis();
    await redis.del("snippets:all:false");
    await redis.del("snippets:all:true");

    return NextResponse.json({ success: true, id, ...updates });
  } catch (error) {
    console.error("Snippet PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update snippet" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await db.delete(textSnippet).where(eq(textSnippet.id, id));

    // Invalidate caches
    const redis = getRedis();
    await redis.del("snippets:all:false");
    await redis.del("snippets:all:true");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Snippet DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete snippet" },
      { status: 500 },
    );
  }
}

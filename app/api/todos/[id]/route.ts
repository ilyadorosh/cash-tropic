import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/drizzle";
import { todoItem } from "@/app/lib/schema";
import { eq } from "drizzle-orm";

const getRedis = () => Redis.fromEnv();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.completed !== undefined) updates.completed = body.completed;
    if (body.priority !== undefined) updates.priority = body.priority;

    try {
      await db.update(todoItem).set(updates).where(eq(todoItem.id, id));
    } catch (dbError) {
      console.error("DB update failed:", dbError);
    }

    // Invalidate cache
    const redis = getRedis();
    await redis.del("todos:all");

    return NextResponse.json({ success: true, id, ...updates });
  } catch (error) {
    console.error("Todo PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
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

    try {
      await db.delete(todoItem).where(eq(todoItem.id, id));
    } catch (dbError) {
      console.error("DB delete failed:", dbError);
    }

    // Invalidate cache
    const redis = getRedis();
    await redis.del("todos:all");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Todo DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 },
    );
  }
}

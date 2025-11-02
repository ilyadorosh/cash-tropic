import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const kv = Redis.fromEnv();
    const body = await req.json();

    // Save to Redis list
    await kv.lpush(
      "clipboard:all",
      JSON.stringify({
        content: body.content,
        timestamp: body.timestamp,
        id: body.id,
      }),
    );

    // Keep only last 50 items
    await kv.ltrim("clipboard:all", 0, 49);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clipboard API error:", error);
    return NextResponse.json(
      { error: "Failed to save clipboard item" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const kv = Redis.fromEnv();
    const items = await kv.lrange("clipboard:all", 0, 50);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Clipboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clipboard items" },
      { status: 500 },
    );
  }
}

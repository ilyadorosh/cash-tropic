// Server-side API route for game data - uses YOUR existing Redis setup
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET(req: Request) {
  const redis = Redis.fromEnv();
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Key ключ required   --- " + searchParams.toString() },
      { status: 400 },
    );
  }

  try {
    const data = await redis.get(key);
    return NextResponse.json({ result: data });
  } catch (error) {
    return NextResponse.json({ error: "Redis error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const redis = Redis.fromEnv();
  const { key, value } = await req.json();

  if (!key) {
    return NextResponse.json({ error: "Key required" }, { status: 400 });
  }

  try {
    await redis.set(key, JSON.stringify(value));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Redis error" }, { status: 500 });
  }
}

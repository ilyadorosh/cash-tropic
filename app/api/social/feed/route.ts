import { NextRequest, NextResponse } from "next/server";
import { getActivityFeed } from "@/app/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const count = Math.min(Number(searchParams.get("count") || 20), 100);

  const events = await getActivityFeed(count);
  return NextResponse.json({ events });
}

export const runtime = "nodejs";

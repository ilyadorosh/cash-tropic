import { NextRequest, NextResponse } from "next/server";
import { setPresence, getOnlineUsers } from "@/app/lib/redis";

// POST /api/social/presence  { username }  — heartbeat, call every ~2 min
export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username)
    return NextResponse.json({ error: "username required" }, { status: 400 });

  await setPresence(username);
  return NextResponse.json({ online: true });
}

// GET /api/social/presence?users=alice,bob,carol
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("users") || "";
  const usernames = raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 50);

  const online = await getOnlineUsers(usernames);
  return NextResponse.json({ online });
}

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getUser } from "@/app/lib/drizzle"; // Your existing Postgres

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Get user from Postgres
  const users = await getUser(email);
  if (!users.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = users[0];

  // Get cached username from Redis
  const redis = Redis.fromEnv();
  const cachedName = await redis.hget("userCache", user.id);

  // Get game progress from Redis
  const gameProgress = await redis.get(`city:${user.id}`);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: cachedName || user.name,
    },
    gameProgress: gameProgress ? JSON.parse(gameProgress as string) : null,
  });
}

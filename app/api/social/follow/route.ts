import { NextRequest, NextResponse } from "next/server";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
} from "@/app/lib/redis";

export async function POST(req: NextRequest) {
  const { follower, followee, action } = await req.json();

  if (!follower || !followee) {
    return NextResponse.json(
      { error: "follower and followee required" },
      { status: 400 },
    );
  }

  if (action === "unfollow") {
    await unfollowUser(follower, followee);
    return NextResponse.json({ success: true, action: "unfollowed" });
  }

  await followUser(follower, followee);
  return NextResponse.json({ success: true, action: "followed" });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const check_follower = searchParams.get("follower");

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  if (check_follower) {
    const following = await isFollowing(check_follower, username);
    return NextResponse.json({ following });
  }

  const [followers, following] = await Promise.all([
    getFollowers(username),
    getFollowing(username),
  ]);

  return NextResponse.json({ followers, following });
}

export const runtime = "nodejs";

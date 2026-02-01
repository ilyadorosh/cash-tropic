import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function POST(req: Request) {
  const redis = Redis.fromEnv();
  const { walletAddress, timestamp, prayerType } = await req.json();

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Missing walletAddress" },
      { status: 400 },
    );
  }

  // Rate limit - max 1 prayer reward per hour per user
  const lastPrayer = await redis.get(`prayer:${walletAddress}:last`);
  const now = Date.now();

  if (lastPrayer && now - Number(lastPrayer) < 3600000) {
    // 1 hour
    const waitMinutes = Math.ceil(
      (3600000 - (now - Number(lastPrayer))) / 60000,
    );
    return NextResponse.json({
      error: `Warte ${waitMinutes} Minuten bis zum nächsten Gebet`,
      success: false,
    });
  }

  try {
    // Connect to Solana (devnet for testing)

    // Record the prayer
    await redis.set(`prayer:${walletAddress}:last`, now);
    await redis.incr(`prayer:${walletAddress}:count`);
    await redis.incr("prayer:global:count");

    // Add to prayer feed
    await redis.lpush(
      "prayer:feed",
      JSON.stringify({
        walletAddress,
        shortWallet: walletAddress.slice(0, 8) + "...",
        prayerType,
        timestamp: new Date().toISOString(),
      }),
    );
    await redis.ltrim("prayer:feed", 0, 99); // Keep last 100

    return NextResponse.json({
      success: true,
      reward: "0.001 SOL",
      message: "Dein Gebet wurde erhört.  🙏",
    });
  } catch (error: any) {
    console.error("Prayer error:", error);

    return NextResponse.json({
      error: error.message || "Gebet fehlgeschlagen",
      success: false,
    });
  }
}

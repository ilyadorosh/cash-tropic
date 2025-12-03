import { NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
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
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed",
    );

    // Treasury wallet - this sends the rewards
    // Generate one with: solana-keygen new --outfile treasury.json
    const treasurySecret = JSON.parse(process.env.SOLANA_TREASURY_KEY || "[]");
    if (treasurySecret.length === 0) {
      return NextResponse.json(
        { error: "Treasury not configured" },
        { status: 500 },
      );
    }
    const treasury = Keypair.fromSecretKey(new Uint8Array(treasurySecret));

    // Player's wallet
    const playerWallet = new PublicKey(walletAddress);

    // Reward amount (0.001 SOL on devnet, adjust for mainnet)
    const rewardLamports = 0.001 * LAMPORTS_PER_SOL;

    // Check treasury balance
    const balance = await connection.getBalance(treasury.publicKey);
    if (balance < rewardLamports + 5000) {
      // + fee buffer
      return NextResponse.json(
        {
          success: true,
          error: "Treasury empty - danke für dein Gebet!  🙏",
          reward: "0",
        },
        { status: 200 },
      );
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey: playerWallet,
        lamports: rewardLamports,
      }),
    );

    // Send it
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      treasury,
    ]);

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
        signature,
      }),
    );
    await redis.ltrim("prayer:feed", 0, 99); // Keep last 100

    return NextResponse.json({
      success: true,
      signature,
      reward: "0.001 SOL",
      message: "Dein Gebet wurde erhört.  🙏",
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    });
  } catch (error: any) {
    console.error("Prayer error:", error);

    return NextResponse.json({
      error: error.message || "Gebet fehlgeschlagen",
      success: false,
    });
  }
}

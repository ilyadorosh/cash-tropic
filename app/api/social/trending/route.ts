import { NextRequest, NextResponse } from "next/server";
import { getTrendingPages, getTrendingProfiles } from "@/app/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 10), 50);

  const [pages, profiles] = await Promise.all([
    getTrendingPages(limit),
    getTrendingProfiles(limit),
  ]);

  // Upstash returns interleaved [member, score, member, score, ...]
  const parsePairs = (raw: (string | number)[]) => {
    const out: { key: string; score: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      out.push({ key: raw[i] as string, score: Number(raw[i + 1]) });
    }
    return out;
  };

  const trendingPages = parsePairs(pages as (string | number)[]).map((p) => {
    const [from, to] = p.key.split(":");
    return { from, to, score: p.score };
  });

  const trendingProfiles = parsePairs(profiles as (string | number)[]).map(
    (p) => ({
      username: p.key,
      score: p.score,
    }),
  );

  return NextResponse.json({
    pages: trendingPages,
    profiles: trendingProfiles,
  });
}

export const runtime = "nodejs";

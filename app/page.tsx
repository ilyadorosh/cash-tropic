import {
  getActivityFeed,
  getTrendingPages,
  getTrendingProfiles,
} from "@/app/lib/redis";
import LoveUniverse from "@/app/components/love-universe";

function parsePairs(
  raw: (string | number)[],
): { key: string; score: number }[] {
  const out: { key: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    out.push({ key: String(raw[i]), score: Number(raw[i + 1]) });
  }
  return out;
}

export default async function Page() {
  const [feedRaw, pagesRaw, profilesRaw] = await Promise.all([
    getActivityFeed(30).catch(() => []),
    getTrendingPages(8).catch(() => []),
    getTrendingProfiles(8).catch(() => []),
  ]);

  const trendingPages = parsePairs(pagesRaw as (string | number)[]).map((p) => {
    const [from, ...rest] = p.key.split(":");
    const to = rest.join(":");
    return { from, to, score: p.score };
  });

  const trendingProfiles = parsePairs(profilesRaw as (string | number)[]).map(
    (p) => ({
      username: p.key,
      score: p.score,
    }),
  );

  return (
    <LoveUniverse
      initialFeed={feedRaw}
      trendingPages={trendingPages}
      trendingProfiles={trendingProfiles}
    />
  );
}

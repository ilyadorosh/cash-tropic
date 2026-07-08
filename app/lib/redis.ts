import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// ── Profile cache (L1 in front of Postgres, 1h TTL) ──────────────────────────

type CachedProfile = { id: string; username: string; context: string | null };

export async function getCachedProfile(username: string) {
  return redis.get<CachedProfile>(`profile:${username}`);
}

export async function setCachedProfile(
  username: string,
  profile: CachedProfile,
) {
  return redis.set(`profile:${username}`, profile, { ex: 3600 });
}

// ── Generated-page HTML cache (L1 in front of Postgres, 24h TTL) ─────────────

function pageKey(from: string, to: string, say?: string) {
  return `page:html:${from}:${to}${say ? `:${encodeURIComponent(say)}` : ""}`;
}

export async function getCachedPageHtml(
  from: string,
  to: string,
  say?: string,
) {
  return redis.get<string>(pageKey(from, to, say));
}

export async function setCachedPageHtml(
  from: string,
  to: string,
  html: string,
  say?: string,
) {
  return redis.set(pageKey(from, to, say), html, { ex: 86400 });
}

// ── View tracking + trending sorted sets ─────────────────────────────────────
//
// trending:pages  – score = views + responses×2
// trending:profiles – score = total engagement across all directions

export async function trackPageView(from: string, to: string) {
  const pipe = redis.pipeline();
  pipe.incr(`views:${from}:${to}`);
  pipe.zincrby("trending:pages", 1, `${from}:${to}`);
  pipe.zincrby(`trending:senders_for:${to}`, 1, from);
  pipe.zincrby("trending:profiles", 0.5, from);
  pipe.zincrby("trending:profiles", 1, to);
  return pipe.exec();
}

// ── Response tracking + feed ──────────────────────────────────────────────────

export async function trackResponse(from: string, to: string, text: string) {
  const pipe = redis.pipeline();
  pipe.incr(`responses:${from}:${to}`);
  pipe.zincrby("trending:pages", 2, `${from}:${to}`);
  pipe.zincrby("trending:profiles", 2, from);
  pipe.zincrby("trending:profiles", 1, to);
  pipe.lpush(
    "feed:global",
    JSON.stringify({
      type: "response",
      from,
      to,
      preview: text.slice(0, 80),
      ts: Date.now(),
    }),
  );
  pipe.ltrim("feed:global", 0, 99);
  return pipe.exec();
}

// ── Page-generation activity feed ────────────────────────────────────────────

export async function trackPageCreated(from: string, to: string) {
  const pipe = redis.pipeline();
  pipe.lpush(
    "feed:global",
    JSON.stringify({ type: "page_created", from, to, ts: Date.now() }),
  );
  pipe.ltrim("feed:global", 0, 99);
  pipe.zincrby("trending:profiles", 1, from);
  pipe.zincrby("trending:profiles", 1, to);
  return pipe.exec();
}

// ── Trending reads ────────────────────────────────────────────────────────────

export async function getTrendingPages(limit = 10) {
  return redis.zrange("trending:pages", 0, limit - 1, {
    rev: true,
    withScores: true,
  });
}

export async function getTrendingProfiles(limit = 10) {
  return redis.zrange("trending:profiles", 0, limit - 1, {
    rev: true,
    withScores: true,
  });
}

// ── Global activity feed ──────────────────────────────────────────────────────

export type FeedEvent =
  | { type: "page_created"; from: string; to: string; ts: number }
  | { type: "response"; from: string; to: string; preview: string; ts: number }
  | { type: "follow"; from: string; to: string; ts: number };

export async function getActivityFeed(count = 20): Promise<FeedEvent[]> {
  const raw = await redis.lrange("feed:global", 0, count - 1);
  return raw
    .map((item) => {
      try {
        return typeof item === "string"
          ? (JSON.parse(item) as FeedEvent)
          : (item as FeedEvent);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as FeedEvent[];
}

// ── Follow graph (Redis Sets) ─────────────────────────────────────────────────

export async function followUser(follower: string, followee: string) {
  const pipe = redis.pipeline();
  pipe.sadd(`followers:${followee}`, follower);
  pipe.sadd(`following:${follower}`, followee);
  pipe.zincrby("trending:profiles", 3, followee);
  pipe.lpush(
    "feed:global",
    JSON.stringify({
      type: "follow",
      from: follower,
      to: followee,
      ts: Date.now(),
    }),
  );
  pipe.ltrim("feed:global", 0, 99);
  return pipe.exec();
}

export async function unfollowUser(follower: string, followee: string) {
  const pipe = redis.pipeline();
  pipe.srem(`followers:${followee}`, follower);
  pipe.srem(`following:${follower}`, followee);
  return pipe.exec();
}

export async function getFollowers(username: string) {
  return redis.smembers(`followers:${username}`);
}

export async function getFollowing(username: string) {
  return redis.smembers(`following:${username}`);
}

export async function isFollowing(
  follower: string,
  followee: string,
): Promise<boolean> {
  return (await redis.sismember(`followers:${followee}`, follower)) === 1;
}

// ── Presence (5-min sliding TTL) ─────────────────────────────────────────────

export async function setPresence(username: string) {
  return redis.set(`presence:${username}`, 1, { ex: 300 });
}

export async function getOnlineUsers(usernames: string[]): Promise<string[]> {
  if (usernames.length === 0) return [];
  const pipe = redis.pipeline();
  for (const u of usernames) pipe.exists(`presence:${u}`);
  const results = await pipe.exec();
  return usernames.filter((_, i) => results[i] === 1);
}

// ── Connection stats ──────────────────────────────────────────────────────────

export async function getConnectionStats(from: string, to: string) {
  const pipe = redis.pipeline();
  pipe.get(`views:${from}:${to}`);
  pipe.get(`responses:${from}:${to}`);
  pipe.zcard(`followers:${to}`);
  pipe.zcard(`following:${from}`);
  const [views, responses, followers, following] = await pipe.exec();
  return {
    views: Number(views) || 0,
    responses: Number(responses) || 0,
    toFollowers: Number(followers) || 0,
    fromFollowing: Number(following) || 0,
  };
}

export async function getProfileStats(username: string) {
  const pipe = redis.pipeline();
  pipe.scard(`followers:${username}`);
  pipe.scard(`following:${username}`);
  pipe.zscore("trending:profiles", username);
  const [followers, following, score] = await pipe.exec();
  return {
    followers: Number(followers) || 0,
    following: Number(following) || 0,
    score: Number(score) || 0,
  };
}

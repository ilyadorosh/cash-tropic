"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./front-page.module.scss";
import type { TrendingPage, TrendingProfile } from "./front-page";

type FeedEvent = {
  type: "page_created" | "response" | "follow";
  from: string;
  to: string;
  preview?: string;
  ts: number;
};

type Props = {
  trendingPages: TrendingPage[];
  trendingProfiles: TrendingProfile[];
};

export default function NetworkPanel({
  trendingPages,
  trendingProfiles,
}: Props) {
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [me, setMe] = useState("");
  const [target, setTarget] = useState("");
  const [followers, setFollowers] = useState<string[] | null>(null);
  const [following, setFollowing] = useState<string[] | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/social/feed?count=15");
      const data = await res.json();
      setFeed(data.events || []);
      setError(null);
    } catch {
      setError("Failed to load activity feed");
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleFollow = async (action: "follow" | "unfollow") => {
    if (!me.trim() || !target.trim()) {
      setError("Both usernames are required");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower: me.trim(),
          followee: target.trim(),
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
      } else {
        await Promise.all([fetchFeed(), lookup(target.trim())]);
      }
    } catch {
      setError("Request failed");
    } finally {
      setBusy(false);
    }
  };

  const lookup = async (username: string) => {
    try {
      const res = await fetch(
        `/api/social/follow?username=${encodeURIComponent(username)}`,
      );
      const data = await res.json();
      setFollowers(data.followers || []);
      setFollowing(data.following || []);
    } catch {
      setFollowers(null);
      setFollowing(null);
    }
  };

  return (
    <div className={styles.panelBox}>
      <h2 className={styles.sectionTitle}>Network Effects</h2>
      <p className={styles.sectionNote}>
        Follow graph and live activity — the connections that compound.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{trendingProfiles.length}</div>
          <div className={styles.statLabel}>Trending profiles</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{trendingPages.length}</div>
          <div className={styles.statLabel}>Trending pages</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{feed.length}</div>
          <div className={styles.statLabel}>Recent events</div>
        </div>
      </div>

      <div className={styles.formRow}>
        <input
          type="text"
          placeholder="your username"
          value={me}
          onChange={(e) => setMe(e.target.value)}
        />
        <input
          type="text"
          placeholder="their username"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <button
          className={styles.button}
          onClick={() => handleFollow("follow")}
          disabled={busy}
        >
          Follow
        </button>
        <button
          className={styles.buttonSecondary}
          onClick={() => handleFollow("unfollow")}
          disabled={busy}
        >
          Unfollow
        </button>
        <button
          className={styles.buttonSecondary}
          onClick={() => target.trim() && lookup(target.trim())}
          disabled={busy}
        >
          Lookup
        </button>
      </div>

      {followers !== null && following !== null && (
        <p className={styles.muted}>
          <strong>{target}</strong>: {followers.length} follower
          {followers.length === 1 ? "" : "s"}
          {followers.length > 0 && ` (${followers.join(", ")})`} · following{" "}
          {following.length}
          {following.length > 0 && ` (${following.join(", ")})`}
        </p>
      )}

      {trendingProfiles.length > 0 && (
        <>
          <h3 className={styles.listItemTitle}>🔥 Trending profiles</h3>
          <div className={styles.list} style={{ marginBottom: 16 }}>
            {trendingProfiles.map((p) => (
              <div key={p.username} className={styles.listItem}>
                <span className={styles.listItemTitle}>{p.username}</span>
                <span className={styles.listItemSub}>
                  score {p.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className={styles.listItemTitle}>⚡ Live activity</h3>
      {feed.length === 0 ? (
        <p className={styles.muted}>No recent activity.</p>
      ) : (
        <div>
          {feed.map((e, i) => (
            <div key={`${e.ts}-${i}`} className={styles.feedItem}>
              <span className={styles.feedType}>{e.type}</span>
              <strong>{e.from}</strong> → <strong>{e.to}</strong>
              {e.preview && (
                <span className={styles.muted}> — {e.preview}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

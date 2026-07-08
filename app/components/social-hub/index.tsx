"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./social-hub.module.scss";

type FeedEvent = {
  type: "page_created" | "response" | "follow";
  from: string;
  to: string;
  preview?: string;
  ts: number;
};

type TrendingPage = { from: string; to: string; score: number };
type TrendingProfile = { username: string; score: number };

type Props = {
  initialFeed: FeedEvent[];
  trendingPages: TrendingPage[];
  trendingProfiles: TrendingProfile[];
};

function reltime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const ICONS: Record<string, string> = {
  page_created: "✨",
  response: "💬",
  follow: "💫",
};

export default function SocialHub({
  initialFeed,
  trendingPages,
  trendingProfiles,
}: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [say, setSay] = useState("");
  const [showSay, setShowSay] = useState(false);
  const [feed, setFeed] = useState<FeedEvent[]>(initialFeed);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Refresh feed every 30s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/social/feed?count=30");
        const data = await res.json();
        if (data.events) setFeed(data.events);
      } catch {}
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const f = from.trim();
    const t = to.trim();
    if (!f || !t) return;
    const s = say.trim();
    const path = s
      ? `/from/${f}/to/${t}/say/${encodeURIComponent(s)}`
      : `/from/${f}/to/${t}`;
    startTransition(() => router.push(path));
  };

  const swapNames = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className={styles.root}>
      {/* animated aurora */}
      <div className={styles.aurora} aria-hidden="true">
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
      </div>

      <div className={styles.shell}>
        {/* ── header ── */}
        <header className={styles.header}>
          <span className={styles.logo}>✦</span>
          <nav className={styles.nav}>
            <Link href="/dashboard">dashboard</Link>
            <Link href="/#/chat">chat</Link>
            <Link href="/conversations">conversations</Link>
            <Link href="/admin/profiles">profiles</Link>
          </nav>
        </header>

        {/* ── hero connect form ── */}
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>reach out to someone</h2>
          <p className={styles.heroSub}>
            type two names and go — the rest is magic
          </p>

          <form onSubmit={handleConnect} className={styles.form}>
            <div className={styles.formRow}>
              <input
                className={styles.nameInput}
                placeholder="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className={styles.swapBtn}
                onClick={swapNames}
                title="swap names"
              >
                ⇄
              </button>
              <input
                className={styles.nameInput}
                placeholder="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className={styles.sayToggle}
                onClick={() => setShowSay((v) => !v)}
              >
                {showSay ? "✕ say" : "+ say"}
              </button>
              <button
                type="submit"
                className={styles.goBtn}
                disabled={isPending || !from || !to}
              >
                {isPending ? "…" : "go →"}
              </button>
            </div>
            {showSay && (
              <input
                className={`${styles.nameInput} ${styles.sayInput}`}
                placeholder="say something special…"
                value={say}
                onChange={(e) => setSay(e.target.value)}
              />
            )}
          </form>
        </section>

        {/* ── two-column main ── */}
        <div className={styles.columns}>
          {/* live feed */}
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>live feed</h3>
            <div className={styles.feedList}>
              {feed.length === 0 && (
                <p className={styles.empty}>
                  quiet here — be the first to connect
                </p>
              )}
              {feed.map((ev, i) => (
                <article
                  key={i}
                  className={styles.feedItem}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className={styles.feedIcon}>
                    {ICONS[ev.type] ?? "•"}
                  </span>
                  <div className={styles.feedBody}>
                    {ev.type !== "response" ? (
                      <Link
                        href={`/from/${ev.from}/to/${ev.to}`}
                        className={styles.feedLink}
                      >
                        {ev.from} → {ev.to}
                      </Link>
                    ) : (
                      <span className={styles.feedLink}>
                        {ev.from} replied to {ev.to}
                      </span>
                    )}
                    {ev.preview && (
                      <p className={styles.feedPreview}>
                        &ldquo;{ev.preview}&rdquo;
                      </p>
                    )}
                    <time className={styles.feedTime}>{reltime(ev.ts)}</time>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* trending */}
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>trending</h3>

            {trendingPages.length > 0 && (
              <div className={styles.trendGroup}>
                <p className={styles.trendGroupLabel}>connections</p>
                {trendingPages.map((p, i) => (
                  <Link
                    key={i}
                    href={`/from/${p.from}/to/${p.to}`}
                    className={styles.trendItem}
                    style={{ "--rank": i } as React.CSSProperties}
                  >
                    <span className={styles.trendRank}>#{i + 1}</span>
                    <span className={styles.trendName}>
                      {p.from} → {p.to}
                    </span>
                    <span className={styles.trendScore}>
                      {Math.round(p.score)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {trendingProfiles.length > 0 && (
              <div className={styles.trendGroup}>
                <p className={styles.trendGroupLabel}>people</p>
                {trendingProfiles.map((p, i) => (
                  <Link
                    key={i}
                    href={`/user/${p.username}`}
                    className={styles.trendItem}
                    style={{ "--rank": i } as React.CSSProperties}
                  >
                    <span className={styles.trendRank}>#{i + 1}</span>
                    <span className={styles.trendName}>{p.username}</span>
                    <span className={styles.trendScore}>
                      {Math.round(p.score)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {trendingPages.length === 0 && trendingProfiles.length === 0 && (
              <p className={styles.empty}>
                make a connection — it&apos;ll show up here
              </p>
            )}

            {/* quick nav tiles */}
            <div className={styles.tiles}>
              {[
                { href: "/love", label: "love", icon: "💝" },
                { href: "/quant", label: "quant", icon: "📈" },
                { href: "/game", label: "game", icon: "🎮" },
                { href: "/4d", label: "4d", icon: "🌀" },
                { href: "/clipboard", label: "clipboard", icon: "📋" },
                { href: "/dashboard", label: "dashboard", icon: "🏠" },
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href} className={styles.tile}>
                  <span className={styles.tileIcon}>{icon}</span>
                  <span className={styles.tileLabel}>{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          built with love — every connection matters
        </footer>
      </div>
    </div>
  );
}

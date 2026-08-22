"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  NATURE_CONSTANTS,
  LANDAUER_REFERENCE_TEMP_K,
  landauerLimit,
} from "@/app/constants";
import { Path } from "@/app/constant";
import styles from "./front-page.module.scss";

/* Lazy-loaded panels: only fetched when the user opens the tab. */
const UsersPanel = dynamic(() => import("./front-page-users"), {
  loading: () => <p className={styles.muted}>Loading users…</p>,
});
const NetworkPanel = dynamic(() => import("./front-page-network"), {
  loading: () => <p className={styles.muted}>Loading network…</p>,
});

export type TrendingPage = { from: string; to: string; score: number };
export type TrendingProfile = { username: string; score: number };

type Props = {
  trendingPages: TrendingPage[];
  trendingProfiles: TrendingProfile[];
};

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "💬 Chat", href: Path.Chat },
  { label: "📄 CV", href: "/cv" },
  { label: "🌀 4D Spacetime", href: "/4d" },
  { label: "🧬 NCA", href: Path.NCA },
  { label: "🧮 Tensor", href: "/tensor" },
  { label: "🎓 Courses", href: "/courses" },
  { label: "🏆 Leaderboard", href: "/leaderboard" },
  { label: "🎭 Masks", href: Path.Masks },
  { label: "⚙️ Settings", href: Path.Settings },
];

type Tab = "none" | "users" | "network";

export default function FrontPage({ trendingPages, trendingProfiles }: Props) {
  const [tab, setTab] = useState<Tab>("none");
  const [temp, setTemp] = useState(LANDAUER_REFERENCE_TEMP_K);

  const toggle = (next: Tab) => setTab((cur) => (cur === next ? "none" : next));

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Illia Dorosh</h1>
        <p className={styles.subtitle}>
          Physics Simulation Engineer · AI Systems · Energy Research — &quot;Blessed
          are the peacemakers.&quot; Building systems that capture more energy for
          humanity.
        </p>
        <nav className={styles.navGrid}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={styles.navLink}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "users" ? styles.tabActive : ""}`}
            onClick={() => toggle("users")}
          >
            👥 Manage users
          </button>
          <button
            className={`${styles.tab} ${tab === "network" ? styles.tabActive : ""}`}
            onClick={() => toggle("network")}
          >
            🕸️ Network effects
          </button>
        </div>
      </header>

      {tab === "users" && (
        <section className={styles.panel}>
          <UsersPanel />
        </section>
      )}
      {tab === "network" && (
        <section className={styles.panel}>
          <NetworkPanel
            trendingPages={trendingPages}
            trendingProfiles={trendingProfiles}
          />
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Constants of Nature</h2>
        <p className={styles.sectionNote}>
          The numbers that run the universe — from my CV&apos;s &quot;Key Equations
          &amp; Obsessions&quot;. α couples them all: α = e² / (4π ε₀ ħ c) ≈ 1/137.036.
        </p>
        <div className={styles.constantsGrid}>
          {NATURE_CONSTANTS.map((c) => (
            <article key={c.symbol} className={styles.constantCard}>
              <div className={styles.constantSymbol}>{c.symbol}</div>
              <div className={styles.constantName}>
                {c.name}
                {c.exact && <span className={styles.exactBadge}>SI exact</span>}
              </div>
              <div className={styles.constantValue}>
                {c.display} <span className={styles.constantUnit}>{c.unit}</span>
              </div>
              <div className={styles.constantNote}>{c.note}</div>
            </article>
          ))}
        </div>

        <div className={styles.landauer}>
          <label htmlFor="landauer-temp">
            Szilard / Landauer limit — energy to erase one bit: E = k_B · T · ln 2
          </label>
          <input
            id="landauer-temp"
            type="range"
            min={1}
            max={1000}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
          />
          <div className={styles.landauerResult}>
            T = {temp} K → E_min = {landauerLimit(temp).toExponential(3)} J
            {temp === LANDAUER_REFERENCE_TEMP_K && " (brain temperature ≈ 310 K)"}
          </div>
        </div>
      </section>
    </div>
  );
}

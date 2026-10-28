"use client";

/* IMAGINE — prompt in, picture out. Talks to /api/imagine, which picks
   whichever image provider has a key configured. */

import { useEffect, useState } from "react";

type Shot = { url: string; prompt: string; provider: string };

export default function ImaginePage() {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [providers, setProviders] = useState<string>("");

  useEffect(() => {
    fetch("/api/imagine")
      .then((r) => r.json())
      .then((j) =>
        setProviders(
          j.providers
            .filter((p: { configured: boolean }) => p.configured)
            .map((p: { name: string }) => p.name)
            .join(" → ") || "none configured",
        ),
      )
      .catch(() => setProviders("?"));
  }, []);

  async function go(e?: React.FormEvent) {
    e?.preventDefault();
    const p = prompt.trim();
    if (!p || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/imagine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(
          j
            ? `${j.error}: ${Object.entries(j.errors ?? {})
                .map(([k, v]) => `${k} ${v}`)
                .join(" | ")}`
            : `HTTP ${r.status}`,
        );
      }
      const url = URL.createObjectURL(await r.blob());
      setShots((s) => [
        { url, prompt: p, provider: r.headers.get("X-Image-Provider") ?? "?" },
        ...s,
      ]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={S.main}>
      <h1 style={S.h1}>imagine</h1>
      <p style={S.sub}>providers: {providers || "…"}</p>
      <form onSubmit={go} style={S.form}>
        <input
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="a neon tram crossing Nürnberg at night, rain"
          style={S.input}
        />
        <button
          disabled={busy || !prompt.trim()}
          style={{ ...S.btn, opacity: busy ? 0.5 : 1 }}
        >
          {busy ? "dreaming…" : "generate"}
        </button>
      </form>
      {err && <p style={S.err}>{err}</p>}
      <section style={S.grid}>
        {shots.map((s) => (
          <figure key={s.url} style={S.fig}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt={s.prompt} style={S.img} />
            <figcaption style={S.cap}>
              <a href={s.url} download="imagine.png" style={S.link}>
                ↓
              </a>{" "}
              {s.prompt} · <i>{s.provider}</i>
            </figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#07070c",
    color: "#e8e6f0",
    padding: "32px 16px",
    fontFamily: "system-ui, sans-serif",
    maxWidth: 960,
    margin: "0 auto",
  },
  h1: {
    fontSize: 40,
    margin: 0,
    letterSpacing: -1,
    background: "linear-gradient(90deg,#ff5fa2,#7c5cff,#2de2e6)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },
  sub: { opacity: 0.5, fontSize: 13, marginTop: 4 },
  form: { display: "flex", gap: 8, margin: "20px 0" },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #2a2840",
    background: "#11101c",
    color: "inherit",
    fontSize: 16,
  },
  btn: {
    padding: "12px 18px",
    borderRadius: 10,
    border: 0,
    background: "#7c5cff",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  err: { color: "#ff6b8a", fontSize: 13, wordBreak: "break-word" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
    gap: 16,
  },
  fig: { margin: 0 },
  img: { width: "100%", borderRadius: 12, display: "block" },
  cap: { fontSize: 12, opacity: 0.7, marginTop: 6 },
  link: { color: "#2de2e6", textDecoration: "none", fontWeight: 700 },
};

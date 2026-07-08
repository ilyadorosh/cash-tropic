"use client";

/* FLOW STATE — ride the kicked rotor. Port of kam_flow.html.
   The standard map IS symplectic Euler for the kicked rotor; the "naive"
   toggle switches to explicit Euler (structure NOT preserved) — the KAM
   tori dissolve and the energy drift meter climbs. That one click is the
   whole argument for Hamiltonian / energy-conserving neural nets. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import styles from "./kam.module.scss";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--fraunces",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--plex-mono",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--plex-sans",
});

type Integrator = "symplectic" | "naive";

export default function KamPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const hud = {
    score: useRef<HTMLSpanElement>(null),
    combo: useRef<HTMLElement>(null),
    flowBar: useRef<HTMLElement>(null),
    heatBar: useRef<HTMLElement>(null),
    lvlTag: useRef<HTMLSpanElement>(null),
    lives: useRef<HTMLDivElement>(null),
    pwr: useRef<HTMLDivElement>(null),
    drift: useRef<HTMLSpanElement>(null),
    start: useRef<HTMLDivElement>(null),
    over: useRef<HTMLDivElement>(null),
    overTitle: useRef<HTMLHeadingElement>(null),
    overMsg: useRef<HTMLDivElement>(null),
    finalScore: useRef<HTMLElement>(null),
  };
  const gameRef = useRef<{
    start: () => void;
    setIntegrator: (v: Integrator) => void;
  } | null>(null);
  const [integrator, setIntegrator] = useState<Integrator>("symplectic");

  useEffect(() => {
    const cv = cvRef.current,
      stage = stageRef.current;
    if (!cv || !stage) return;
    const ctx = cv.getContext("2d")!;
    const TAU = Math.PI * 2,
      GOLD = (Math.sqrt(5) - 1) / 2;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let W = 0,
      H = 0;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    let disposed = false;

    function resize() {
      const s = stage!.getBoundingClientRect();
      const side = Math.min(s.width, s.height);
      W = Math.floor(side);
      H = Math.floor(side);
      cv!.style.width = W + "px";
      cv!.style.height = H + "px";
      cv!.width = Math.floor(W * DPR);
      cv!.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    // ---------- dynamics: kicked rotor ----------
    // symplectic Euler == the standard map (area-preserving, KAM tori survive)
    // explicit Euler   == same equation, structure lost (tori dissolve, energy drifts)
    let integ: Integrator = "symplectic";
    function step(th: number, a: number, K: number): [number, number] {
      const na = a + (K / TAU) * Math.sin(TAU * th);
      let nth = th + (integ === "symplectic" ? na : a);
      nth -= Math.floor(nth);
      return [nth, na];
    }
    function robustness(a: number) {
      let r = a - Math.floor(a),
        m = 1;
      for (let q = 1; q <= 8; q++) {
        const x = q * r,
          d = Math.abs(x - Math.round(x));
        if (q * d < m) m = q * d;
      }
      return m;
    }
    const GR = robustness(GOLD);
    const NOBLES = [GOLD, 1 - GOLD, Math.sqrt(2) - 1, 1 - (Math.sqrt(2) - 1)];

    // ---------- terrain ----------
    let K = 0.3;
    let portrait: HTMLCanvasElement | null = null;
    const GN = 72;
    const chaos = new Float32Array(GN * GN);
    function buildTerrain() {
      for (let gx = 0; gx < GN; gx++) {
        for (let gy = 0; gy < GN; gy++) {
          let th = (gx + 0.5) / GN,
            a = (gy + 0.5) / GN,
            amin = a,
            amax = a;
          for (let i = 0; i < 90; i++) {
            [th, a] = step(th, a, K);
            const aw = a - Math.floor(a);
            if (aw < amin) amin = aw;
            if (aw > amax) amax = aw;
          }
          chaos[gx * GN + gy] = Math.min(1, (amax - amin) / 0.18);
        }
      }
      const off = document.createElement("canvas");
      off.width = 900;
      off.height = 900;
      const c = off.getContext("2d")!;
      c.fillStyle = "#05070f";
      c.fillRect(0, 0, 900, 900);
      for (const g of NOBLES) {
        const y = (1 - g) * 900;
        c.strokeStyle = "rgba(245,194,75,0.30)";
        c.setLineDash([6, 7]);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(900, y);
        c.stroke();
        c.setLineDash([]);
      }
      const S = 170,
        IT = 420;
      for (let s = 0; s < S; s++) {
        const a0 = (s + 0.5) / S;
        let th = 0,
          a = a0,
          amin = a0,
          amax = a0;
        const xs = new Float32Array(IT),
          ys = new Float32Array(IT);
        for (let i = 0; i < IT; i++) {
          [th, a] = step(th, a, K);
          const aw = a - Math.floor(a);
          if (aw < amin) amin = aw;
          if (aw > amax) amax = aw;
          xs[i] = th;
          ys[i] = aw;
        }
        const sp = amax - amin,
          rb = robustness(a0) / GR;
        const col =
          sp > 0.16
            ? "rgba(255,92,114,0.30)"
            : rb > 0.9
              ? "rgba(245,194,75,0.5)"
              : "rgba(111,224,208,0.34)";
        c.fillStyle = col;
        for (let i = 0; i < IT; i++)
          c.fillRect(xs[i] * 900, ys[i] * 900, 1.4, 1.4);
      }
      portrait = off;
    }
    function chaosAt(th: number, a: number) {
      let gx = Math.floor((th - Math.floor(th)) * GN);
      let gy = Math.floor(Math.min(0.999, Math.max(0, a)) * GN);
      gx = ((gx % GN) + GN) % GN;
      gy = Math.min(GN - 1, Math.max(0, gy));
      return chaos[gx * GN + gy];
    }
    function nearestRegularA(th: number, aGuess: number) {
      let best = aGuess,
        bd = 9;
      for (let k = 0; k < GN; k++) {
        const a = (k + 0.5) / GN;
        if (chaosAt(th, a) < 0.25) {
          const d = Math.abs(a - aGuess);
          if (d < bd) {
            bd = d;
            best = a;
          }
        }
      }
      return best;
    }

    // ---------- ambient flow particles ----------
    const NP = 560;
    const pTh = new Float32Array(NP),
      pA = new Float32Array(NP);
    function seedParticles() {
      for (let i = 0; i < NP; i++) {
        pTh[i] = Math.random();
        pA[i] = Math.random();
      }
    }

    // ---------- energy-drift ensemble (unwrapped momentum, the HNN meter) ----------
    const ND = 240;
    const dTh = new Float32Array(ND),
      dA = new Float32Array(ND);
    let e0 = 0;
    function seedDrift() {
      for (let i = 0; i < ND; i++) {
        dTh[i] = Math.random();
        dA[i] = 0.2 + Math.random() * 0.6;
      }
      e0 = energyOf();
    }
    function energyOf() {
      let e = 0;
      for (let i = 0; i < ND; i++) e += dA[i] * dA[i];
      return e / ND / 2;
    }
    function stepDrift() {
      for (let i = 0; i < ND; i++) {
        const na = dA[i] + (K / TAU) * Math.sin(TAU * dTh[i]);
        let nth = dTh[i] + (integ === "symplectic" ? na : dA[i]);
        nth -= Math.floor(nth);
        dTh[i] = nth;
        dA[i] = na; // momentum left unwrapped on purpose
      }
    }
    function updateDriftHUD() {
      const drift = (energyOf() - e0) / Math.max(0.0001, e0);
      const el = hud.drift.current;
      if (!el) return;
      el.textContent =
        "⟨E⟩ drift " + (drift >= 0 ? "+" : "") + (drift * 100).toFixed(1) + "%";
      el.className = `${styles.drift} ${Math.abs(drift) > 0.25 ? styles.bad : ""}`;
    }

    // ---------- game state ----------
    type Node = { th: number; a: number; r: number; grab: number };
    type PowerDef = {
      key: string;
      glyph: string;
      name: string;
      col: string;
      dur: number;
    };
    type Power = { th: number; a: number; p: PowerDef; bob: number };
    let state: "ready" | "play" | "over" = "ready";
    let comet: {
      th: number;
      a: number;
      tgt: number;
      trail: [number, number][];
    };
    let score = 0,
      combo = 1,
      flow = 0,
      heat = 0,
      lives = 3,
      shake = 0,
      invuln = 0,
      level = 0;
    let nodes: Node[] = [],
      powers: Power[] = [];
    let active: string | null = null,
      activeT = 0;
    let tPrev = 0;
    const pops: { th: number; a: number; t: number; m: number }[] = [];

    const POWERS: PowerDef[] = [
      {
        key: "shield",
        glyph: "⟁",
        name: "KAM SHIELD",
        col: "#6FE0D0",
        dur: 6.5,
      },
      {
        key: "golden",
        glyph: "φ",
        name: "GOLDEN LOCK",
        col: "#F5C24B",
        dur: 5.5,
      },
      {
        key: "surge",
        glyph: "⚡",
        name: "RESONANCE SURGE ×3",
        col: "#FF5C72",
        dur: 6.5,
      },
      {
        key: "cohere",
        glyph: "◈",
        name: "COHERENCE",
        col: "#9B7BFF",
        dur: 7.0,
      },
    ];

    function spawnNode() {
      for (let tries = 0; tries < 40; tries++) {
        const th = Math.random(),
          a = 0.06 + Math.random() * 0.88;
        if (chaosAt(th, a) < 0.22) {
          nodes.push({ th, a, r: 0, grab: 0 });
          return;
        }
      }
      nodes.push({ th: Math.random(), a: GOLD, r: 0, grab: 0 });
    }
    function spawnPower() {
      for (let tries = 0; tries < 40; tries++) {
        const th = Math.random(),
          a = 0.06 + Math.random() * 0.88;
        if (chaosAt(th, a) < 0.2) {
          powers.push({
            th,
            a,
            p: POWERS[(Math.random() * POWERS.length) | 0],
            bob: Math.random() * TAU,
          });
          return;
        }
      }
    }
    function pickRegularA() {
      for (let t = 0; t < 30; t++) {
        const a = 0.06 + Math.random() * 0.88;
        if (chaosAt(Math.random(), a) < 0.25) return a;
      }
      return GOLD;
    }
    function nearestNoble(a: number) {
      let b = NOBLES[0],
        bd = 9;
      for (const n of NOBLES) {
        const d = Math.abs(n - a);
        if (d < bd) {
          bd = d;
          b = n;
        }
      }
      return b;
    }

    function reset() {
      K = 0.3;
      level = 0;
      buildTerrain();
      seedParticles();
      seedDrift();
      comet = { th: 0.2, a: GOLD, tgt: GOLD, trail: [] };
      score = 0;
      combo = 1;
      flow = 0;
      heat = 0;
      lives = 3;
      invuln = 1.2;
      shake = 0;
      nodes = [];
      powers = [];
      active = null;
      activeT = 0;
      for (let i = 0; i < 6; i++) spawnNode();
      drawLives();
    }

    // ---------- input ----------
    let pointerA = GOLD,
      keyUp = false,
      keyDown = false;
    function setPointer(e: PointerEvent) {
      const r = cv!.getBoundingClientRect();
      const cy = e.clientY - r.top;
      pointerA = 1 - Math.min(1, Math.max(0, cy / r.height));
    }
    const onPointerDown = (e: PointerEvent) => {
      if (state === "play") {
        e.preventDefault();
        setPointer(e);
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (state === "play") setPointer(e);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        keyUp = true;
        e.preventDefault();
      }
      if (e.key === "ArrowDown") {
        keyDown = true;
        e.preventDefault();
      }
      if (e.code === "Space" && state !== "play") startGame();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") keyUp = false;
      if (e.key === "ArrowDown") keyDown = false;
    };

    // ---------- loop ----------
    let raf = 0;
    function startGame() {
      hud.start.current?.classList.add(styles.hide);
      hud.over.current?.classList.add(styles.hide);
      reset();
      state = "play";
      tPrev = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }
    function loop(now: number) {
      if (disposed || state !== "play") return;
      const dt = Math.min(0.05, (now - tPrev) / 1000);
      tPrev = now;
      update(dt);
      render();
      raf = requestAnimationFrame(loop);
    }

    function update(dt: number) {
      const targetK = 0.3 + Math.min(0.78, score / 2600);
      if (targetK - K > 0.04) {
        K += 0.06;
        buildTerrain();
      }
      level = K;

      for (let i = 0; i < NP; i++) {
        const [nt, na] = step(pTh[i], pA[i], K);
        pTh[i] = nt;
        pA[i] = na - Math.floor(na);
        if (Math.random() < 0.006) {
          pTh[i] = Math.random();
          pA[i] = Math.random();
        }
      }
      stepDrift();

      if (active) {
        activeT -= dt;
        if (activeT <= 0) active = null;
      }

      let tgt = pointerA;
      if (keyUp) tgt = Math.min(0.97, comet.a + 0.02);
      if (keyDown) tgt = Math.max(0.03, comet.a - 0.02);
      if (active === "golden") tgt = nearestNoble(comet.a);
      comet.tgt = tgt;
      const ease = active === "cohere" ? 0.2 : 0.13;
      comet.a += (tgt - comet.a) * ease;

      const ch = chaosAt(comet.th, comet.a);
      const shielded = active === "shield";
      if (ch > 0.28 && !shielded) {
        comet.a += (Math.random() * 2 - 1) * 0.01 * ch;
        comet.th += (Math.random() * 2 - 1) * 0.004 * ch;
        shake = Math.min(8, shake + ch * 0.7);
      }
      comet.a = Math.min(0.985, Math.max(0.015, comet.a));

      const [nt2] = step(comet.th, comet.a, K);
      let vth = nt2 - comet.th;
      vth -= Math.round(vth);
      comet.th += vth * 0.16 * 8 * dt + comet.a * 0.02 * 8 * dt;
      comet.th -= Math.floor(comet.th);

      comet.trail.push([comet.th, comet.a]);
      if (comet.trail.length > 70) comet.trail.shift();
      shake *= 0.86;

      const heating = shielded ? 0 : ch;
      const cool = active === "cohere" ? 1.5 : 1.0;
      heat += heating * 1.5 * dt - cool * 0.85 * dt;
      if (invuln > 0) {
        invuln -= dt;
        heat = Math.min(heat, 0.4);
      }
      heat = Math.max(0, heat);
      if (heat >= 1) overheat();

      if (ch < 0.2) flow = Math.min(1, flow + 0.18 * dt);
      else {
        flow = Math.max(0, flow - 0.5 * dt);
        if (ch > 0.45) combo = 1;
      }
      combo = Math.max(
        1,
        Math.min(
          8,
          1 + Math.floor(flow * 4) + (robustness(comet.a) / GR > 0.85 ? 2 : 0),
        ),
      );

      for (const n of nodes) {
        n.r += dt;
        let dth = Math.abs(n.th - comet.th);
        dth = Math.min(dth, 1 - dth);
        if (n.grab > 0) {
          n.grab -= dt;
          continue;
        }
        if (dth < 0.035 && Math.abs(n.a - comet.a) < 0.035) {
          const mult = combo * (active === "surge" ? 3 : 1);
          score += 10 * mult;
          flow = Math.min(1, flow + 0.12);
          n.grab = 0.0;
          n.th = Math.random();
          n.a = pickRegularA();
          n.r = 0;
          pops.push({ th: n.th, a: n.a, t: 0, m: mult });
          if (Math.random() < 0.16 && powers.length < 2) spawnPower();
        }
      }
      for (let i = powers.length - 1; i >= 0; i--) {
        const pw = powers[i];
        pw.bob += dt * 3;
        let dth = Math.abs(pw.th - comet.th);
        dth = Math.min(dth, 1 - dth);
        if (dth < 0.045 && Math.abs(pw.a - comet.a) < 0.045) {
          active = pw.p.key;
          activeT = pw.p.dur;
          powers.splice(i, 1);
          if (active === "shield" || active === "cohere")
            heat = Math.max(0, heat - 0.4);
          showPwr(pw.p);
        }
      }
      while (nodes.length < 6) spawnNode();
      updateHUD();
    }

    function overheat() {
      lives--;
      drawLives();
      heat = 0;
      flow = 0;
      combo = 1;
      invuln = 1.6;
      shake = 8;
      comet.a = nearestRegularA(comet.th, comet.a);
      active = null;
      if (lives <= 0) gameOver();
    }
    function overText() {
      const m = [
        "The orbit thermalized — momentum diffused into the chaotic sea. Aim for the badly-approximable frequencies (golden φ) where tori survive.",
        "Resonances broke your torus. Stay where the bar is cyan; the golden mean is the last current to hold.",
        "Too much heat, too far from a noble torus. KAM rewards the irrational.",
      ];
      return m[(Math.random() * m.length) | 0];
    }
    function gameOver() {
      state = "over";
      if (hud.finalScore.current)
        hud.finalScore.current.textContent = String(score);
      if (hud.overMsg.current) hud.overMsg.current.textContent = overText();
      if (hud.overTitle.current)
        hud.overTitle.current.textContent =
          score > 1200 ? "IN THE FLOW" : "OVERHEATED";
      hud.over.current?.classList.remove(styles.hide);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(preview);
    }

    // ---------- render ----------
    function render() {
      ctx.clearRect(0, 0, W, H);
      let ox = 0,
        oy = 0;
      if (shake > 0.2 && !reduce) {
        ox = (Math.random() * 2 - 1) * shake;
        oy = (Math.random() * 2 - 1) * shake;
      }
      ctx.save();
      ctx.translate(ox, oy);

      if (portrait) ctx.drawImage(portrait, 0, 0, W, H);

      for (let i = 0; i < NP; i++) {
        const x = pTh[i] * W,
          y = (1 - pA[i]) * H,
          c = chaosAt(pTh[i], pA[i]);
        ctx.fillStyle =
          c > 0.4 ? "rgba(255,92,114,0.5)" : "rgba(143,210,224,0.45)";
        ctx.fillRect(x, y, 1.6, 1.6);
      }

      for (const n of nodes) {
        if (n.grab > 0) continue;
        const x = n.th * W,
          y = (1 - n.a) * H,
          pr = 2 + Math.sin(n.r * 4) * 1;
        ctx.beginPath();
        ctx.arc(x, y, 5.5 + pr, 0, TAU);
        ctx.strokeStyle = "rgba(245,194,75,0.5)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, TAU);
        ctx.fillStyle = "#F5C24B";
        ctx.fill();
      }
      for (const pw of powers) {
        const x = pw.th * W,
          y = (1 - pw.a) * H,
          s = Math.sin(pw.bob) * 2;
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = pw.p.col;
        ctx.shadowBlur = 12;
        ctx.fillStyle = pw.p.col;
        ctx.fillText(pw.p.glyph, x, y + s);
        ctx.shadowBlur = 0;
      }

      const tr = comet.trail;
      for (let i = 0; i < tr.length; i++) {
        const dth = Math.abs(tr[i][0] - comet.th);
        if (dth > 0.5) continue;
        ctx.fillStyle = `rgba(236,231,218,${(i / tr.length) * 0.5})`;
        ctx.fillRect(tr[i][0] * W - 1, (1 - tr[i][1]) * H - 1, 2, 2);
      }
      const cx = comet.th * W,
        cy = (1 - comet.a) * H;
      const aura =
        active === "shield"
          ? "#6FE0D0"
          : active === "golden"
            ? "#F5C24B"
            : active === "surge"
              ? "#FF5C72"
              : active === "cohere"
                ? "#9B7BFF"
                : "#ffffff";
      ctx.shadowColor = aura;
      ctx.shadowBlur = invuln > 0 && Math.floor(invuln * 10) % 2 ? 6 : 18;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, TAU);
      ctx.fillStyle = aura;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, TAU);
      ctx.fillStyle = "#fff";
      ctx.fill();
      if (active === "shield") {
        ctx.beginPath();
        ctx.arc(cx, cy, 13, 0, TAU);
        ctx.strokeStyle = "rgba(111,224,208,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.t += 0.04;
        const x = p.th * W,
          y = (1 - p.a) * H;
        ctx.globalAlpha = Math.max(0, 1 - p.t);
        ctx.fillStyle = "#F5C24B";
        ctx.font = "600 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText("+" + 10 * p.m, x, y - 12 - p.t * 18);
        ctx.globalAlpha = 1;
        if (p.t > 1) pops.splice(i, 1);
      }

      if (heat > 0.4) {
        const g = ctx.createRadialGradient(
          W / 2,
          H / 2,
          H * 0.3,
          W / 2,
          H / 2,
          H * 0.72,
        );
        g.addColorStop(0, "rgba(255,92,114,0)");
        g.addColorStop(1, `rgba(255,92,114,${(heat - 0.4) * 0.5})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // ---------- HUD ----------
    function updateHUD() {
      if (hud.score.current) hud.score.current.textContent = String(score);
      if (hud.combo.current) hud.combo.current.textContent = "×" + combo;
      if (hud.flowBar.current)
        hud.flowBar.current.style.width = flow * 100 + "%";
      if (hud.heatBar.current)
        hud.heatBar.current.style.width = heat * 100 + "%";
      if (hud.lvlTag.current)
        hud.lvlTag.current.textContent = "ε " + K.toFixed(2);
      updateDriftHUD();
    }
    function drawLives() {
      const el = hud.lives.current;
      if (!el) return;
      el.innerHTML = "";
      for (let i = 0; i < 3; i++) {
        const d = document.createElement("div");
        d.className = "h" + (i < lives ? "" : " off");
        el.appendChild(d);
      }
    }
    let pwrTimer: ReturnType<typeof setTimeout> | undefined;
    function showPwr(p: PowerDef) {
      const el = hud.pwr.current;
      if (!el) return;
      el.textContent = p.glyph + " " + p.name;
      el.style.color = p.col;
      clearTimeout(pwrTimer);
      pwrTimer = setTimeout(() => {
        el.textContent = "";
      }, p.dur * 1000);
    }

    // idle preview on start/over screens
    function preview() {
      if (disposed || state === "play") return;
      ctx.clearRect(0, 0, W, H);
      if (portrait) ctx.drawImage(portrait, 0, 0, W, H);
      for (let i = 0; i < NP; i++) {
        const [nt, na] = step(pTh[i], pA[i], K);
        pTh[i] = nt;
        pA[i] = na - Math.floor(na);
        if (Math.random() < 0.006) {
          pTh[i] = Math.random();
          pA[i] = Math.random();
        }
        const c = chaosAt(pTh[i], pA[i]);
        ctx.fillStyle =
          c > 0.4 ? "rgba(255,92,114,0.4)" : "rgba(143,210,224,0.4)";
        ctx.fillRect(pTh[i] * W, (1 - pA[i]) * H, 1.6, 1.6);
      }
      stepDrift();
      updateDriftHUD();
      raf = requestAnimationFrame(preview);
    }

    // boot
    resize();
    window.addEventListener("resize", resize);
    cv.addEventListener("pointerdown", onPointerDown);
    cv.addEventListener("pointermove", onPointerMove);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    buildTerrain();
    seedParticles();
    seedDrift();
    comet = { th: 0.2, a: GOLD, tgt: GOLD, trail: [] };
    raf = requestAnimationFrame(preview);

    gameRef.current = {
      start: startGame,
      setIntegrator(v: Integrator) {
        integ = v;
        buildTerrain(); // tori dissolve (or return) instantly
        seedDrift(); // fair energy comparison from now
      },
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(pwrTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointermove", onPointerMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickIntegrator = (v: Integrator) => {
    setIntegrator(v);
    gameRef.current?.setIntegrator(v);
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${fraunces.variable} ${plexMono.variable} ${plexSans.variable}`}
    >
      <div ref={stageRef} className={styles.stage}>
        <canvas ref={cvRef} className={styles.scope} />
      </div>

      <div className={styles.hud}>
        <div className={styles.top}>
          <div className={styles.stat}>
            <span className="lab">score</span>
            <span className="val" ref={hud.score}>
              0
            </span>
          </div>
          <div className={styles.flowwrap}>
            <div className={styles.flowlab}>
              <span>flow state</span>
              <b ref={hud.combo}>×1</b>
            </div>
            <div className={`${styles.meter} ${styles.flow}`}>
              <i ref={hud.flowBar} />
            </div>
            <div className={styles.heatwrap}>
              <div className={styles.flowlab}>
                <span>heat · entropy</span>
                <span ref={hud.lvlTag} style={{ color: "var(--cyan)" }}>
                  ε 0.30
                </span>
              </div>
              <div className={`${styles.meter} ${styles.heat}`}>
                <i ref={hud.heatBar} />
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.lives} ref={hud.lives} />
            <div className={styles.pwr} ref={hud.pwr} />
          </div>
        </div>

        {/* the physics lab — flip it and watch the tori dissolve */}
        <div className={styles.lab}>
          <div className={styles.labRow}>
            <span className={styles.labLab}>integrator</span>
            <span className={styles.seg}>
              <button
                className={integrator === "symplectic" ? "on" : ""}
                onClick={() => pickIntegrator("symplectic")}
              >
                symplectic
              </button>
              <button
                className={integrator === "naive" ? "on" : ""}
                onClick={() => pickIntegrator("naive")}
              >
                naive euler
              </button>
            </span>
            <span className={styles.drift} ref={hud.drift}>
              ⟨E⟩ drift +0.0%
            </span>
          </div>
          <div className={styles.labNote}>
            same equation, different discretization — symplectic preserves the
            structure (KAM tori, bounded energy); naive euler doesn&apos;t. this
            is the argument for Hamiltonian neural nets.
          </div>
        </div>

        <div className={styles.hint}>
          move to set your frequency · ride cyan · avoid magenta
        </div>
        <Link href="/" className={styles.back}>
          ← act in love
        </Link>
      </div>

      <div className={styles.screen} ref={hud.start}>
        <h1>
          FLOW <em>STATE</em>
        </h1>
        <div className="sub">
          You&apos;re a packet of energy in a <b className="k">kicked rotor</b>{" "}
          — a rotor that gets a periodic shove. Steer your{" "}
          <b className="k">frequency</b> (move up/down). Ride the cyan currents
          (stable tori, where the flow carries you for free) and gather energy.
          Stray into the magenta sea and you <b className="k">overheat</b>.
        </div>
        <div className={styles.legend}>
          <span>
            <i className={styles.dot} style={{ background: "var(--cyan)" }} />
            stable torus · cold
          </span>
          <span>
            <i className={styles.dot} style={{ background: "var(--hot)" }} />
            chaos · heating
          </span>
          <span>
            <i className={styles.dot} style={{ background: "var(--gold)" }} />
            golden mean
          </span>
        </div>
        <button
          className={styles.play}
          onClick={() => gameRef.current?.start()}
        >
          enter the flow ▸
        </button>
        <div className={styles.tiny}>
          move pointer / finger — or ↑ ↓ keys · ε rises as you go
        </div>
      </div>

      <div className={`${styles.screen} ${styles.hide}`} ref={hud.over}>
        <h1 ref={hud.overTitle}>OVERHEATED</h1>
        <div className={styles.goStats}>
          flow score &nbsp; <b ref={hud.finalScore}>0</b>
        </div>
        <div className="sub" ref={hud.overMsg} />
        <button
          className={styles.play}
          onClick={() => gameRef.current?.start()}
        >
          flow again ▸
        </button>
      </div>
    </div>
  );
}

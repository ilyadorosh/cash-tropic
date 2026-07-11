"use client";

// TronGame.tsx — canvas renderer + input + HUD for the engine. The look is
// the whole point: near-black field, faint grid, walls drawn twice (wide
// blurred pass for glow, thin bright core), white-hot cycle heads, derez
// particle bursts. Plain 2D canvas, DPR capped, rAF paused when hidden —
// same performance contract as the Plaza.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMatch,
  GRID_H,
  GRID_W,
  resetRound,
  steerPlayer,
  tick,
  turnPlayer,
  type Dir,
  type TronState,
} from "./engine";
import {
  loadProfile,
  recordMatch,
  tuneOpponents,
  type TronProfile,
} from "./memory";
import { cannedLine, speak, type VoiceMoment } from "./voice";
import { TronSound } from "./sound";

const BASE_TICK_MS = 66;
const MIN_TICK_MS = 34;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function TronGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TronState | null>(null);
  const profileRef = useRef<TronProfile | null>(null);
  const soundRef = useRef<TronSound | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState({ player: 0, ai: 0, phase: "attract" });
  const [voiceLine, setVoiceLine] = useState("");
  const [muted, setMuted] = useState(false);

  const say = useCallback((moment: VoiceMoment) => {
    setVoiceLine(cannedLine(moment));
    const s = stateRef.current;
    const p = profileRef.current;
    if (!s || !p) return;
    void speak(moment, p, { player: s.playerScore, ai: s.aiScore }).then(
      (line) => setVoiceLine(line),
    );
  }, []);

  const startMatch = useCallback(() => {
    const profile = loadProfile();
    profileRef.current = profile;
    stateRef.current = createMatch(tuneOpponents(profile));
    soundRef.current ??= new TronSound();
    soundRef.current.start();
    setStarted(true);
    say("matchStart");
  }, [say]);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);

    let raf = 0;
    let lastStep = performance.now();
    let countdownAt = performance.now();
    let roundOverAt = 0;
    let disposed = false;

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const burst = (cx: number, cy: number, color: string) => {
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.4 + Math.random() * 2.2;
        sparksRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 1,
          color,
        });
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      const key = e.key.toLowerCase();
      const abs: Record<string, Dir> = {
        arrowup: 0,
        w: 0,
        arrowright: 1,
        d: 1,
        arrowdown: 2,
        s: 2,
        arrowleft: 3,
        a: 3,
      };
      if (key in abs) {
        e.preventDefault();
        const before = s.riders[0].dir;
        steerPlayer(s, abs[key]);
        if (s.riders[0].dir !== before) soundRef.current?.turn();
      } else if (key === "m") {
        setMuted(soundRef.current?.toggleMute() ?? false);
      }
    };
    window.addEventListener("keydown", onKey);

    // touch: tap left half = turn left, right half = turn right
    const onPointer = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s || e.pointerType === "mouse") return;
      const before = s.riders[0].dir;
      turnPlayer(s, e.clientX < window.innerWidth / 2 ? -1 : 1);
      if (s.riders[0].dir !== before) soundRef.current?.turn();
    };
    window.addEventListener("pointerdown", onPointer);

    const frame = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const s = stateRef.current;
      const profile = profileRef.current;
      if (!s || !profile) return;

      // ── simulation ──
      if (s.phase === "countdown" && now - countdownAt > 700) {
        countdownAt = now;
        s.countdown--;
        soundRef.current?.countdown(s.countdown <= 0);
        if (s.countdown <= 0) {
          s.phase = "running";
          soundRef.current?.setRunning(true);
          lastStep = now;
        }
      }
      const pace = Math.min(1, (s.round - 1) / 4 + s.tick / 900);
      const stepMs = BASE_TICK_MS - (BASE_TICK_MS - MIN_TICK_MS) * pace;
      soundRef.current?.setPace(pace);
      while (s.phase === "running" && now - lastStep >= stepMs) {
        lastStep += stepMs;
        const events = tick(s);
        for (const r of events.derezzed) {
          soundRef.current?.derez();
          if (r.derezAt) burst(r.derezAt[0], r.derezAt[1], r.color);
        }
        if (events.roundOver) {
          soundRef.current?.setRunning(false);
          roundOverAt = now;
          if (events.matchOver) {
            profileRef.current = recordMatch(s, profile);
            say(s.playerScore > s.aiScore ? "matchWon" : "matchLost");
          } else if (events.playerWonRound === false) {
            say("playerDerez");
          } else if (events.playerWonRound === true) {
            say("aiDerez");
          }
        }
      }
      if (s.phase === "roundOver" && now - roundOverAt > 1800) {
        s.round++;
        resetRound(s, tuneOpponents(profileRef.current!));
        countdownAt = now;
      }
      setHud((h) =>
        h.player !== s.playerScore || h.ai !== s.aiScore || h.phase !== s.phase
          ? { player: s.playerScore, ai: s.aiScore, phase: s.phase }
          : h,
      );

      // ── render ──
      const w = canvas.width;
      const hgt = canvas.height;
      const cell = Math.min(w / GRID_W, hgt / GRID_H);
      const ox = (w - cell * GRID_W) / 2;
      const oy = (hgt - cell * GRID_H) / 2;
      const px = (gx: number) => ox + gx * cell + cell / 2;
      const py = (gy: number) => oy + gy * cell + cell / 2;

      ctx.fillStyle = "#04070d";
      ctx.fillRect(0, 0, w, hgt);
      ctx.strokeStyle = "rgba(90, 200, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= GRID_W; x += 4) {
        ctx.moveTo(ox + x * cell, oy);
        ctx.lineTo(ox + x * cell, oy + GRID_H * cell);
      }
      for (let y = 0; y <= GRID_H; y += 4) {
        ctx.moveTo(ox, oy + y * cell);
        ctx.lineTo(ox + GRID_W * cell, oy + y * cell);
      }
      ctx.stroke();
      // arena boundary
      ctx.strokeStyle = "rgba(140, 235, 255, 0.5)";
      ctx.lineWidth = Math.max(1.5, cell * 0.25);
      ctx.strokeRect(ox, oy, GRID_W * cell, GRID_H * cell);

      for (const rider of s.riders) {
        if (rider.trail.length < 2 && !rider.alive) continue;
        // pass 1: glow
        ctx.strokeStyle = rider.color;
        ctx.globalAlpha = rider.alive ? 0.32 : 0.1;
        ctx.lineWidth = cell * 1.6;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(px(rider.trail[0][0]), py(rider.trail[0][1]));
        for (const [tx, ty] of rider.trail) ctx.lineTo(px(tx), py(ty));
        ctx.stroke();
        // pass 2: core
        ctx.globalAlpha = rider.alive ? 1 : 0.28;
        ctx.lineWidth = Math.max(1.5, cell * 0.45);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (rider.alive) {
          ctx.fillStyle = "#ffffff";
          const r = cell * 0.55;
          ctx.fillRect(px(rider.x) - r / 2, py(rider.y) - r / 2, r, r);
        }
      }

      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx * 0.35;
        sp.y += sp.vy * 0.35;
        sp.life -= 0.03;
        if (sp.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = sp.life;
        ctx.fillStyle = sp.color;
        ctx.fillRect(px(sp.x) - 1.5, py(sp.y) - 1.5, 3, 3);
      }
      ctx.globalAlpha = 1;

      if (s.phase === "countdown") {
        ctx.fillStyle = "#bff4ff";
        ctx.font = `700 ${Math.round(hgt * 0.14)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(String(Math.max(1, s.countdown)), w / 2, hgt / 2);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [started, say]);

  useEffect(() => () => soundRef.current?.dispose(), []);

  const matchOver = hud.phase === "matchOver";
  const profile = profileRef.current;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#04070d",
        color: "#bff4ff",
        fontFamily: "monospace",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* score + voice */}
      {started && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            textAlign: "center",
            pointerEvents: "none",
            textShadow: "0 0 12px rgba(120,230,255,0.8)",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6 }}>
            <span style={{ color: "#8ef7ff" }}>{hud.player}</span>
            <span style={{ opacity: 0.5 }}> ⟨ GRID ⟩ </span>
            <span style={{ color: "#ff9a3c" }}>{hud.ai}</span>
          </div>
          {voiceLine && (
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#ff9a3c",
                opacity: 0.95,
              }}
            >
              VEX: {voiceLine}
            </div>
          )}
        </div>
      )}

      {/* attract / match-over overlays */}
      {(!started || matchOver) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            background: "rgba(2, 4, 9, 0.72)",
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: 14,
              textShadow: "0 0 24px rgba(120,230,255,0.9)",
            }}
          >
            THE GRID
          </div>
          {matchOver && stateRef.current && (
            <div style={{ fontSize: 18, color: "#ff9a3c" }}>
              {stateRef.current.playerScore > stateRef.current.aiScore
                ? "PROGRAMS DEREZZED — THE GRID IS YOURS"
                : "END OF LINE, USER"}
            </div>
          )}
          {profile && profile.games > 0 && (
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              lifetime {profile.wins}W / {profile.losses}L — the programs
              remember
            </div>
          )}
          <button
            onClick={startMatch}
            style={{
              padding: "12px 34px",
              fontSize: 16,
              fontFamily: "monospace",
              letterSpacing: 4,
              color: "#04070d",
              background: "#8ef7ff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              boxShadow: "0 0 22px rgba(120,230,255,0.7)",
            }}
          >
            {matchOver ? "REMATCH" : "ENTER THE GRID"}
          </button>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            arrows / WASD to steer · tap sides on mobile · M mutes · first to 3
          </div>
        </div>
      )}

      {muted && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 16,
            fontSize: 12,
            opacity: 0.6,
          }}
        >
          muted
        </div>
      )}
    </div>
  );
}

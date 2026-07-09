"use client";

/* The Plaza — model selection as a place, not a dropdown.
   Every model is a character standing in its provider's corner of a small
   top-down world. Walk up to someone (WASD / arrows / tap) and press Enter
   (or tap them again) to start talking — that switches the session's model.
   Your masks hang out in the south quarter; talking to one opens a new
   session wearing it. The UI everyone already knows... from life.

   Perf contract: plain 2D canvas (no WebGL), rAF only while mounted,
   paused when the tab is hidden, DPR capped — costs nothing when closed
   and <1ms/frame when open. */

import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store";
import { ModelType } from "../store/config";
import { Mask, useMaskStore } from "../store/mask";
import { ServiceProvider, Path } from "../constant";
import { useAllModels } from "../utils/hooks";
import { showToast } from "./ui-lib";
import { hueOf, colorLuminance } from "./plaza-utils";
import styles from "./game-chat-nav.module.scss";

interface GameChatNavProps {
  onClose?: () => void;
  onOpenList?: () => void;
}

type Npc = {
  kind: "model" | "mask" | "door";
  x: number;
  y: number;
  hue: number;
  label: string;
  sub: string;
  // model
  modelName?: string;
  providerName?: string;
  // mask
  mask?: Mask;
  // door: hard navigation target outside the SPA router (e.g. /game)
  href?: string;
  isCurrent?: boolean;
};

const TALK_RADIUS = 52;
const NPC_SPACING = 78;
const PLAYER_SPEED = 190; // px/s

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
}

export function GameChatNav({ onClose, onOpenList }: GameChatNavProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatStore = useChatStore();
  const maskStore = useMaskStore();
  const navigate = useNavigate();

  const session = chatStore.currentSession();
  const currentModel = session.mask.modelConfig.model;
  const currentProvider =
    session.mask.modelConfig?.providerName || ServiceProvider.Groq;

  const allModels = useAllModels();

  // ---- build the world: provider corners around a ring, masks down south ----
  const world = useMemo(() => {
    const models = allModels.filter((m) => m.available);
    const byProvider = new Map<string, typeof models>();
    for (const m of models) {
      const p = m?.provider?.providerName || "unknown";
      if (!byProvider.has(p)) byProvider.set(p, []);
      byProvider.get(p)!.push(m);
    }

    const providers = [...byProvider.entries()];
    const npcs: Npc[] = [];
    const signs: { x: number; y: number; text: string; hue: number }[] = [];

    // ring radius grows with provider count so corners don't overlap
    const ringR = Math.max(300, providers.length * 78);
    providers.forEach(([provider, list], pi) => {
      const angle = (pi / providers.length) * Math.PI * 2 - Math.PI / 2;
      const cx = Math.cos(angle) * ringR;
      const cy = Math.sin(angle) * ringR * 0.72; // squash to landscape
      const hue = hueOf(provider);
      const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(list.length))));
      signs.push({ x: cx, y: cy - 66, text: provider, hue });
      list.forEach((m, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        npcs.push({
          kind: "model",
          x: cx + (col - (cols - 1) / 2) * NPC_SPACING,
          y: cy + row * NPC_SPACING,
          hue,
          label: m.displayName || m.name,
          sub: provider,
          modelName: m.name,
          providerName: provider,
          isCurrent:
            m.name === currentModel && provider === (currentProvider as string),
        });
      });
    });

    // masks quarter: getAll() = user masks first, then builtins (system
    // prompts that actually modify the model — each carries its own
    // context + modelConfig), capped so the quarter stays walkable
    const masks = maskStore.getAll().slice(0, 12);
    const maskY = ringR * 0.72 + 190;
    signs.push({ x: 0, y: maskY - 66, text: "masks", hue: 300 });
    const mCols = 4;
    masks.forEach((mask, i) => {
      const row = Math.floor(i / mCols);
      const col = i % mCols;
      npcs.push({
        kind: "mask",
        x: (col - (mCols - 1) / 2) * NPC_SPACING,
        y: maskY + row * NPC_SPACING,
        hue: hueOf(mask.name),
        label: mask.name,
        sub: "mask → new chat",
        mask,
      });
    });
    // doors: the full mask shop, and the 3D city (it has model selection
    // and temperature in-world already)
    const doorX = ((mCols - 1) / 2) * NPC_SPACING + NPC_SPACING * 1.5;
    npcs.push({
      kind: "door",
      x: doorX,
      y: maskY,
      hue: 300,
      label: "mask shop",
      sub: "all masks →",
    });
    npcs.push({
      kind: "door",
      x: doorX + NPC_SPACING * 1.2,
      y: maskY,
      hue: 210,
      label: "the city (3D)",
      sub: "drive the world →",
      href: "/game",
    });

    // world bounds with margin
    const xs = npcs.map((n) => n.x);
    const ys = npcs.map((n) => n.y);
    const margin = 220;
    return {
      npcs,
      signs,
      minX: Math.min(...xs, 0) - margin,
      maxX: Math.max(...xs, 0) + margin,
      minY: Math.min(...ys, 0) - margin,
      maxY: Math.max(...ys, 0) + margin,
    };
  }, [allModels, maskStore, currentModel, currentProvider]);

  // mutable refs the game loop reads/writes without re-rendering React
  const worldRef = useRef(world);
  worldRef.current = world;
  const stateRef = useRef({
    px: 0,
    py: 120, // spawn slightly south of center
    keys: new Set<string>(),
    target: null as { x: number; y: number; npc: Npc | null } | null,
    facing: -Math.PI / 2,
    walkPhase: 0,
  });

  const talkTo = (npc: Npc) => {
    if (npc.kind === "model") {
      chatStore.updateCurrentSession((s) => {
        s.mask.modelConfig.model = npc.modelName as ModelType;
        s.mask.modelConfig.providerName = npc.providerName as ServiceProvider;
        s.mask.syncGlobalConfig = false;
      });
      showToast(`now talking to ${npc.label}`);
      onClose?.();
    } else if (npc.kind === "mask" && npc.mask) {
      chatStore.newSession(npc.mask);
      navigate(Path.Chat);
      showToast(`new chat as ${npc.label}`);
      onClose?.();
    } else if (npc.kind === "door") {
      if (npc.href) {
        // app-router page outside the SPA — needs a full navigation
        window.location.href = npc.href;
      } else {
        navigate(Path.Masks);
      }
      onClose?.();
    }
  };
  const talkToRef = useRef(talkTo);
  talkToRef.current = talkTo;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const theme = {
      bg: cssVar("--gray", "#eee"),
      ink: cssVar("--black", "#303030"),
      card: cssVar("--white", "#fff"),
      primary: cssVar("--primary", "#1d93ab"),
      border: "rgba(128,128,128,0.35)",
    };
    // detect dark from the resolved --white variable itself — body classes
    // lied to us once (white-on-white nameplates), resolved colors can't
    const dark = colorLuminance(theme.card) < 0.5;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let vw = 0;
    let vh = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      vw = Math.max(280, rect.width);
      vh = Math.max(220, rect.height);
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const st = stateRef.current;

    const nearestNpc = () => {
      let best: Npc | null = null;
      let bestD = Infinity;
      for (const n of worldRef.current.npcs) {
        const d = Math.hypot(n.x - st.px, n.y - st.py);
        if (d < bestD) {
          bestD = d;
          best = n;
        }
      }
      return bestD <= TALK_RADIUS ? best : null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(k)
      ) {
        st.keys.add(k);
        st.target = null; // keys override tap-target
        e.preventDefault();
      } else if (k === "enter" || k === "e" || k === " ") {
        const npc = nearestNpc();
        if (npc) {
          talkToRef.current(npc);
          e.preventDefault();
        }
      } else if (k === "escape") {
        onClose?.();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => st.keys.delete(e.key.toLowerCase());

    // tap/click: walk there; tapping a character walks over and talks
    const onPointerDown = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = ev.clientX - rect.left;
      const sy = ev.clientY - rect.top;
      // screen → world (camera is centered on player, clamped below)
      const cam = cameraPos();
      const wx = sx + cam.x;
      const wy = sy + cam.y;
      let hit: Npc | null = null;
      for (const n of worldRef.current.npcs) {
        if (Math.hypot(n.x - wx, n.y - wy) < 30) {
          hit = n;
          break;
        }
      }
      if (hit && Math.hypot(hit.x - st.px, hit.y - st.py) <= TALK_RADIUS) {
        talkToRef.current(hit); // already close enough — just talk
      } else if (hit) {
        st.target = { x: hit.x, y: hit.y + 40, npc: hit };
      } else {
        st.target = { x: wx, y: wy, npc: null };
      }
    };

    const cameraPos = () => {
      const w = worldRef.current;
      let cx = st.px - vw / 2;
      let cy = st.py - vh / 2;
      cx = Math.max(w.minX, Math.min(w.maxX - vw, cx));
      cy = Math.max(w.minY, Math.min(w.maxY - vh, cy));
      return { x: cx, y: cy };
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);

    let raf = 0;
    let last = performance.now();

    const drawPerson = (
      x: number,
      y: number,
      hue: number,
      opts: {
        r?: number;
        current?: boolean;
        near?: boolean;
        door?: boolean;
        facing?: number;
        walk?: number;
      },
    ) => {
      const r = opts.r ?? 11;
      // shadow
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.75, r * 0.95, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fill();

      if (opts.door) {
        // a little doorway instead of a person
        ctx.fillStyle = `hsl(${hue} 45% ${dark ? 32 : 72}%)`;
        ctx.strokeStyle = theme.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - r, y - r * 1.6, r * 2, r * 2.4, 4);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + r * 0.45, y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = theme.ink;
        ctx.fill();
        return;
      }

      // feet (walk cycle)
      const step = Math.sin(opts.walk ?? 0) * r * 0.45;
      ctx.fillStyle = `hsl(${hue} 30% ${dark ? 22 : 35}%)`;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(
          x + s * r * 0.4,
          y + r * 0.55 + s * step * 0.4,
          r * 0.28,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      // body
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue} ${dark ? 45 : 62}% ${dark ? 38 : 62}%)`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsl(${hue} 40% ${dark ? 60 : 30}%)`;
      ctx.stroke();
      // head, nudged toward facing
      const fx = Math.cos(opts.facing ?? -Math.PI / 2) * r * 0.3;
      const fy = Math.sin(opts.facing ?? -Math.PI / 2) * r * 0.3;
      ctx.beginPath();
      ctx.arc(x + fx, y - r * 0.15 + fy, r * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue} 35% ${dark ? 68 : 30}%)`;
      ctx.fill();

      if (opts.current) {
        ctx.beginPath();
        ctx.arc(x, y, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = "#e6b800";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      if (opts.near) {
        const pulse = 4 + Math.sin(performance.now() / 180) * 2;
        ctx.beginPath();
        ctx.arc(x, y, r + pulse + 4, 0, Math.PI * 2);
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const nameplate = (x: number, y: number, text: string, strong: boolean) => {
      ctx.font = `${strong ? "600 " : ""}11px system-ui, sans-serif`;
      const t = text.length > 22 ? text.slice(0, 21) + "…" : text;
      const w = ctx.measureText(t).width + 12;
      ctx.fillStyle = dark ? "rgba(20,20,20,0.82)" : "rgba(255,255,255,0.88)";
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y, w, 17, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = theme.ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t, x, y + 9);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden) return; // pause everything while tab is hidden

      // ---- movement ----
      let dx = 0;
      let dy = 0;
      const K = st.keys;
      if (K.has("w") || K.has("arrowup")) dy -= 1;
      if (K.has("s") || K.has("arrowdown")) dy += 1;
      if (K.has("a") || K.has("arrowleft")) dx -= 1;
      if (K.has("d") || K.has("arrowright")) dx += 1;
      if (dx === 0 && dy === 0 && st.target) {
        const tx = st.target.x - st.px;
        const ty = st.target.y - st.py;
        const d = Math.hypot(tx, ty);
        if (d < 6) {
          const npc = st.target.npc;
          st.target = null;
          if (npc) talkToRef.current(npc); // tapped a person: arrive and talk
        } else {
          dx = tx / d;
          dy = ty / d;
        }
      }
      const moving = dx !== 0 || dy !== 0;
      if (moving) {
        const len = Math.hypot(dx, dy);
        st.px += (dx / len) * PLAYER_SPEED * dt;
        st.py += (dy / len) * PLAYER_SPEED * dt;
        st.facing = Math.atan2(dy, dx);
        st.walkPhase += dt * 13;
        const w = worldRef.current;
        st.px = Math.max(w.minX + 20, Math.min(w.maxX - 20, st.px));
        st.py = Math.max(w.minY + 20, Math.min(w.maxY - 20, st.py));
      }

      // ---- draw ----
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, vw, vh);

      const cam = cameraPos();
      ctx.translate(-cam.x, -cam.y);

      // plaza floor: subtle grid + a center square
      const w = worldRef.current;
      ctx.strokeStyle = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
      ctx.lineWidth = 1;
      const grid = 90;
      for (let gx = Math.floor(w.minX / grid) * grid; gx < w.maxX; gx += grid) {
        ctx.beginPath();
        ctx.moveTo(gx, w.minY);
        ctx.lineTo(gx, w.maxY);
        ctx.stroke();
      }
      for (let gy = Math.floor(w.minY / grid) * grid; gy < w.maxY; gy += grid) {
        ctx.beginPath();
        ctx.moveTo(w.minX, gy);
        ctx.lineTo(w.maxX, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-130, -130, 260, 260);

      // provider signs
      for (const s of w.signs) {
        ctx.font = "700 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `hsl(${s.hue} 55% ${dark ? 65 : 35}%)`;
        ctx.fillText(s.text.toUpperCase(), s.x, s.y);
        ctx.strokeStyle = `hsl(${s.hue} 55% ${dark ? 65 : 35}% / 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x - 44, s.y + 11);
        ctx.lineTo(s.x + 44, s.y + 11);
        ctx.stroke();
      }

      // npcs
      const near = nearestNpc();
      for (const n of w.npcs) {
        drawPerson(n.x, n.y, n.hue, {
          current: n.isCurrent,
          near: n === near,
          door: n.kind === "door",
          walk: 0,
        });
        nameplate(n.x, n.y + 18, n.label, !!n.isCurrent);
        if (n === near) {
          // talk bubble
          ctx.font = "600 11px system-ui, sans-serif";
          const hint = n.kind === "door" ? "⏎ enter" : "⏎ talk";
          const bw = ctx.measureText(hint).width + 14;
          ctx.fillStyle = theme.primary;
          ctx.beginPath();
          ctx.roundRect(n.x - bw / 2, n.y - 44, bw, 18, 9);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.fillText(hint, n.x, n.y - 35);
        }
      }

      // player
      drawPerson(st.px, st.py, 195, {
        r: 12,
        facing: st.facing,
        walk: moving ? st.walkPhase : 0,
      });
      nameplate(st.px, st.py + 20, "you", true);

      // tap-target marker
      if (st.target && !st.target.npc) {
        ctx.beginPath();
        ctx.arc(st.target.x, st.target.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
    // the loop reads live data through refs; deliberately mount-once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.header}>
        <h2>the plaza — walk up to someone to talk</h2>
        <div className={styles.headerActions}>
          {onOpenList && (
            <button className={styles.listButton} onClick={onOpenList}>
              📋 list
            </button>
          )}
          {onClose && (
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className={styles.gameCanvas} />
      <div className={styles.instructions}>
        WASD / arrows / tap to walk · ⏎ to talk · esc to leave
      </div>
    </div>
  );
}

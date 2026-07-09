"use client";

/* The Chat Map — the memory of your life with the models.
   Timeline of every conversation as dots on a line, coupled to the list:
   hover a dot, the chat lights up; hover a chat, the dot lights up.
   This IS the session list (ChatList is retired). */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatSession, useChatStore } from "@/app/store";
import { Path } from "@/app/constant";
import { showConfirm } from "./ui-lib";
import Locale from "../locales";
import SidebarPlaza from "./sidebar-plaza";

type ChatId = string;
interface ChatMeta {
  id: ChatId;
  title: string;
  lastUpdate: number;
  snippet: string;
  model: string;
  count: number;
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
}

export default function ChatMapSidebar(): JSX.Element {
  const chatStore = useChatStore();
  const [sessions, currentSessionIndex, selectSession] = useChatStore((s) => [
    s.sessions as ChatSession[],
    s.currentSessionIndex,
    s.selectSession,
  ]);

  const navigate = useNavigate();

  const chats = useMemo<ChatMeta[]>(() => {
    return (sessions ?? []).map((s: ChatSession, idx) => {
      const messages = Array.isArray(s.messages) ? s.messages : [];
      const firstUser = messages.find((m) => m?.role === "user" && m.content);
      const lastMsg = messages[messages.length - 1];
      const lastUpdate = Number(s.lastUpdate ?? lastMsg?.date);
      const title =
        s.topic ||
        s.mask?.name ||
        (firstUser?.content ? String(firstUser.content).slice(0, 80) : "") ||
        "Untitled";
      const snippet =
        (lastMsg?.content && String(lastMsg.content)) ||
        (firstUser?.content && String(firstUser.content)) ||
        "";
      return {
        id: String(s.id ?? idx),
        title,
        lastUpdate,
        snippet,
        model: s.mask?.modelConfig?.model ?? "",
        count: messages.length,
      };
    });
  }, [sessions]);

  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    sessions?.forEach((s, i) => map.set(String(s.id ?? i), i));
    return map;
  }, [sessions]);

  const activeId = useMemo(
    () => String(sessions?.[currentSessionIndex]?.id ?? currentSessionIndex),
    [sessions, currentSessionIndex],
  );

  const [query, setQuery] = useState("");
  const [hoverId, setHoverId] = useState<ChatId | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = chats.slice().sort((a, b) => b.lastUpdate - a.lastUpdate);
    if (!q) return list;
    return list.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.snippet || "").toLowerCase().includes(q),
    );
  }, [chats, query]);

  // ---------- timeline canvas ----------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotMapRef = useRef<{ id: ChatId; x: number; y: number; r: number }[]>(
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(180, rect.width || 240);
    const height = 64;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const primary = cssVar("--primary", "#1d93ab");
    const pad = 12;
    const y = height / 2 - 6;
    const radius = 5;
    const hitR = 10;

    const timeline = chats.slice().sort((a, b) => a.lastUpdate - b.lastUpdate);
    dotMapRef.current = [];

    ctx.strokeStyle = "rgba(128,128,128,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();

    if (timeline.length === 0) {
      ctx.fillStyle = "rgba(128,128,128,0.8)";
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("no memories yet", width / 2, y + 22);
      return;
    }

    const times = timeline.map((t) => t.lastUpdate);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const span = Math.max(1, maxT - minT);

    timeline.forEach((c) => {
      const ratio = (c.lastUpdate - minT) / span;
      const x = pad + ratio * (width - pad * 2);
      const isHover = hoverId === c.id;
      const isActive = activeId === c.id;

      if (isActive) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHover || isActive ? primary : "rgba(128,128,128,0.75)";
      ctx.fill();
      if (isHover) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(29,147,171,0.15)";
        ctx.fill();
      }
      dotMapRef.current.push({ id: c.id, x, y, r: hitR });
    });

    const fmt = (ts: number) => new Date(ts).toLocaleDateString();
    ctx.fillStyle = "rgba(128,128,128,0.8)";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(fmt(timeline[0].lastUpdate), pad, y + 22);
    ctx.textAlign = "right";
    ctx.fillText(
      fmt(timeline[timeline.length - 1].lastUpdate),
      width - pad,
      y + 22,
    );
  }, [chats, hoverId, activeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onPointerMove = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const hit = dotMapRef.current.find((d) => {
        const dx = d.x - x,
          dy = d.y - y;
        return dx * dx + dy * dy <= d.r * d.r;
      });
      setHoverId(hit ? hit.id : null);
    };
    const onPointerLeave = () => setHoverId(null);
    const onClick = () => {
      if (!hoverId) return;
      const idx = idToIndex.get(String(hoverId));
      if (idx == null) return;
      selectSession(idx);
      navigate(Path.Chat);
    };
    const onResize = () => setHoverId((h) => h);

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, [hoverId, idToIndex, selectSession, navigate]);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  const truncate = (text: string, max = 64) => {
    if (!text) return "";
    const one = text.replace(/\s+/g, " ").trim();
    return one.length <= max ? one : one.slice(0, max - 1).trim() + "…";
  };

  const onDelete = async (e: React.MouseEvent, id: ChatId) => {
    e.stopPropagation();
    const idx = idToIndex.get(id);
    if (idx == null) return;
    if (await showConfirm(Locale.Home.DeleteChat)) {
      chatStore.deleteSession(idx);
    }
  };

  // ---------- styles (theme-aware via NextChat CSS vars) ----------
  const containerStyle: React.CSSProperties = {
    width: "100%",
    padding: "4px 2px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 0,
    flex: 1,
    color: "var(--black)",
  };
  const searchStyle: React.CSSProperties = {
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid var(--border-in-light, #ddd)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "var(--white)",
    color: "var(--black)",
    fontSize: 13,
  };

  return (
    <aside aria-label="Chat map" style={containerStyle}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Timeline of chats"
        style={{
          width: "100%",
          height: 64,
          borderRadius: 8,
          background: "transparent",
          cursor: "pointer",
          flexShrink: 0,
        }}
      />
      <input
        aria-label="Search chats by title or snippet"
        placeholder="search your memory…"
        style={searchStyle}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div
        style={{ overflowY: "auto", flex: 1, paddingRight: 2, minHeight: 0 }}
      >
        {filtered.length === 0 ? (
          <div style={{ opacity: 0.6, padding: 12, fontSize: 13 }}>
            No chats yet — start a new conversation.
          </div>
        ) : (
          filtered.map((c) => {
            const idx = idToIndex.get(c.id);
            const isHover = hoverId === c.id;
            const isActive = activeId === c.id;
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (idx == null) return;
                  selectSession(idx);
                  navigate(Path.Chat);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    (e.currentTarget as HTMLDivElement).click();
                  }
                }}
                onMouseEnter={() => setHoverId(c.id)}
                onMouseLeave={() => setHoverId((h) => (h === c.id ? null : h))}
                style={{
                  padding: "8px 10px",
                  marginBottom: 5,
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  cursor: "pointer",
                  outline: "none",
                  position: "relative",
                  background: isActive
                    ? "var(--white)"
                    : isHover
                      ? "var(--hover-color, rgba(128,128,128,0.08))"
                      : "transparent",
                  border: isActive
                    ? "1px solid var(--primary, #1d93ab)"
                    : "1px solid transparent",
                  boxShadow: isActive ? "var(--card-shadow)" : "none",
                }}
                aria-label={`Open chat ${c.title || "Untitled"}`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {c.title || "Untitled"}
                  </div>
                  {(isHover || isActive) && (
                    <button
                      aria-label="Delete chat"
                      title="Delete chat"
                      onClick={(e) => onDelete(e, c.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "inherit",
                        opacity: 0.55,
                        cursor: "pointer",
                        fontSize: 13,
                        lineHeight: 1,
                        padding: "2px 4px",
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.65,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {truncate(c.snippet, 64)}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 10.5,
                    opacity: 0.75,
                  }}
                >
                  {/* the model is a character, not a hidden setting */}
                  {c.model && (
                    <span
                      style={{
                        fontFamily: "monospace",
                        border: "1px solid var(--border-in-light, #ddd)",
                        borderRadius: 6,
                        padding: "0 5px",
                        maxWidth: 140,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🤖 {c.model}
                    </span>
                  )}
                  <span>{c.count} msgs</span>
                  <span>{formatDate(c.lastUpdate)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* the empty space below the list is the mini plaza: models and
          masks as tappable people — no menus, no clicking around */}
      <SidebarPlaza />
    </aside>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChatSession,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "@/app/store";
import { Path } from "@/app/constant";

// Types from your task description
type ChatId = string;
interface ChatMeta {
  id: ChatId;
  title: string;
  lastUpdate: number;
  thumb?: string;
  snippet: string;
}

export default function ChatMapSidebar(): JSX.Element {
  // read store the same way ChatList does
  const [sessions, selectSession] = useChatStore((s) => [
    s.sessions as ChatSession[],
    s.selectSession,
  ]);

  const navigate = useNavigate();

  // build ChatMeta[] from sessions
  const chats = useMemo<ChatMeta[]>(() => {
    return (sessions ?? []).map((s: ChatSession, idx) => {
      const messages = Array.isArray(s.messages) ? s.messages : [];
      const firstUser = messages.find((m) => m?.role === "user" && m.content);
      const lastMsg = messages[messages.length - 1];

      const lastUpdate = Number(s.lastUpdate ?? s.lastUpdate ?? lastMsg?.date);
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
        thumb: s.mask?.avatar,
        snippet,
      };
    });
  }, [sessions]);

  // map id -> index so clicks can select the session
  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    sessions?.forEach((s, i) => map.set(String(s.id ?? i), i));
    return map;
  }, [sessions]);

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

  // timeline canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotMapRef = useRef<{ id: ChatId; x: number; y: number; r: number }[]>(
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(240, rect.width || 260);
    const height = Math.max(60, rect.height || 80);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const timelinePadding = 12;
    const y = height / 2;
    const radius = 6;
    const dotHitRadius = 10;

    const timeline = chats.slice().sort((a, b) => a.lastUpdate - b.lastUpdate);
    dotMapRef.current = [];

    // base line
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(timelinePadding, y);
    ctx.lineTo(width - timelinePadding, y);
    ctx.stroke();

    if (timeline.length === 0) {
      ctx.fillStyle = "#888";
      ctx.font =
        "12px system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
      ctx.textAlign = "center";
      ctx.fillText("No chats yet", width / 2, y + 24);
      return;
    }

    const times = timeline.map((t) => t.lastUpdate);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const span = Math.max(1, maxT - minT);

    timeline.forEach((c) => {
      const ratio = (c.lastUpdate - minT) / span;
      const x = timelinePadding + ratio * (width - timelinePadding * 2);
      const isHover = hoverId === c.id;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHover ? "#0b74de" : "#2b2b2b";
      ctx.fill();

      if (isHover) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(11,116,222,0.12)";
        ctx.fill();
      }

      dotMapRef.current.push({ id: c.id, x, y, r: dotHitRadius });
    });

    // date hints
    const fmt = (ts: number) => new Date(ts).toLocaleDateString();
    ctx.fillStyle = "#666";
    ctx.font =
      "11px system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
    ctx.textAlign = "center";
    ctx.fillText(fmt(timeline[0].lastUpdate), timelinePadding, y + 20);
    ctx.fillText(
      fmt(timeline[timeline.length - 1].lastUpdate),
      width - timelinePadding,
      y + 20,
    );
  }, [chats, hoverId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerMove = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const hit = dotMapRef.current.find((d) => {
        const dx = d.x - x;
        const dy = d.y - y;
        return dx * dx + dy * dy <= d.r * d.r;
      });
      setHoverId(hit ? hit.id : null);
    };

    const onPointerLeave = () => setHoverId(null);

    const onClick = () => {
      if (!hoverId) return;
      const idx = idToIndex.get(String(hoverId));
      if (idx == null) return;

      // Select the session in store
      selectSession(idx);

      // Navigate using React Router (like ChatList does)
      navigate(Path.Chat);
    };

    const onResize = () => setHoverId((h) => h); // trigger redraw

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

  // helpers
  const formatDateTime = (ts: number) => new Date(ts).toLocaleString();
  const truncateOneLine = (text: string, max = 80) => {
    if (!text) return "";
    const one = text.replace(/\s+/g, " ").trim();
    return one.length <= max ? one : one.slice(0, max - 1).trim() + "…";
  };

  // styles
  const containerStyle: React.CSSProperties = {
    width: 260,
    minWidth: 200,
    maxWidth: 340,
    borderRight: "1px solid #eee",
    padding: 12,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "#fff",
  };
  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
  };
  const searchStyle: React.CSSProperties = {
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #ddd",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const listStyle: React.CSSProperties = {
    overflowY: "auto",
    flex: 1,
    paddingRight: 4,
  };
  const itemStyleBase: React.CSSProperties = {
    padding: "8px 6px",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    cursor: "pointer",
    outline: "none",
  };
  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#111",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  const metaStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#666",
  };

  // UI
  return (
    <aside aria-label="Chat map" style={containerStyle}>
      <div style={headerStyle}>
        <span>📍</span>
        <span>Chat Map</span>
      </div>

      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Timeline of chats"
        height={80}
        style={{
          width: "100%",
          height: 80,
          borderRadius: 8,
          background: "#fafafa",
          cursor: "pointer",
        }}
      />

      <input
        aria-label="Search chats by title or snippet"
        placeholder="Search chats..."
        style={searchStyle}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div style={listStyle}>
        {filtered.length === 0 ? (
          <div style={{ color: "#666", padding: 12 }}>
            No chats yet — start a new conversation.
          </div>
        ) : (
          filtered.map((c) => {
            const idx = idToIndex.get(c.id);
            const isHover = hoverId === c.id;
            const itemStyle: React.CSSProperties = {
              ...itemStyleBase,
              background: isHover ? "rgba(11,116,222,0.06)" : "transparent",
              border: isHover
                ? "1px solid rgba(11,116,222,0.12)"
                : "1px solid transparent",
            };
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
                style={itemStyle}
                aria-label={`Open chat ${c.title || "Untitled"}`}
              >
                <div style={titleStyle}>{c.title || "Untitled"}</div>
                <div style={metaStyle}>
                  <span>{formatDateTime(c.lastUpdate)}</span>
                  <span style={{ marginLeft: 8, color: "#999" }}>·</span>
                  <span style={{ marginLeft: 8 }}>
                    {truncateOneLine(c.snippet || "", 80)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

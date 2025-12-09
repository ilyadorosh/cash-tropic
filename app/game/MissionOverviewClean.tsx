"use client";
import React, { useEffect, useMemo, useState } from "react";
import type { Mission, MissionCategory } from "./types";

interface MissionOverviewProps {
  missions: Mission[];
  onClose: () => void;
  onSelectMission: (missionId: string) => void;
  currentMissionId?: string;
}

const CATEGORY_COLORS: Record<MissionCategory, string> = {
  physics: "#667eea",
  finance: "#48bb78",
  health: "#fc8181",
  spiritual: "#9f7aea",
  historical: "#ed8936",
};

export default function MissionOverview({
  missions,
  onClose,
  onSelectMission,
  currentMissionId,
}: MissionOverviewProps) {
  const [category, setCategory] = useState<MissionCategory | "all">("all");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key.toLowerCase() === "m") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(
    () =>
      category === "all"
        ? missions
        : missions.filter((m) => m.category === category),
    [missions, category],
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: 20,
        overflowY: "auto",
        zIndex: 200,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <button
        onClick={onClose}
        style={{
          float: "right",
          fontSize: 24,
          background: "transparent",
          border: "none",
          color: "#fff",
        }}
      >
        ✕
      </button>
      <h1 style={{ fontFamily: "Impact", fontSize: 36, marginTop: 8 }}>
        📋 Missions
      </h1>

      <div
        style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <button
          onClick={() => setCategory("all")}
          style={{
            padding: 8,
            background: category === "all" ? "#76b900" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          All
        </button>
        {(Object.keys(CATEGORY_COLORS) as MissionCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              padding: 8,
              background: category === c ? "#76b900" : "#333",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectMission(m.id)}
            role="button"
            tabIndex={0}
            style={{
              background: m.category ? CATEGORY_COLORS[m.category] : "#444",
              padding: 14,
              borderRadius: 8,
              cursor: "pointer",
              border: m.id === currentMissionId ? "3px solid #fff" : undefined,
            }}
          >
            <h3 style={{ margin: 0 }}>{m.title ?? m.name}</h3>
            {m.description && (
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>{m.description}</p>
            )}
            {m.objectives && m.objectives.length > 0 && (
              <p style={{ margin: "8px 0 0", fontSize: 12, opacity: 0.9 }}>
                {m.objectives.length} objectives
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

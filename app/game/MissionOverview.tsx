"use client";
import React from "react";
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
  historical: "#ed8936"
};

export default function MissionOverview({ missions, onClose, onSelectMission, currentMissionId }: MissionOverviewProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", color: "white", padding: 20, overflowY: "auto", zIndex: 200, fontFamily: "Arial, sans-serif" }}>
      <button onClick={onClose} style={{ float: "right", fontSize: 24 }}>
        ×
      </button>
      <h1 style={{ fontFamily: "Impact", fontSize: 36 }}>📋 MISSIONEN</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {missions.map((mission) => (
          <div
            key={mission.id}
            onClick={() => onSelectMission(mission.id)}
            style={{
              background: CATEGORY_COLORS[mission.category],
              color: "#fff",
              padding: 16,
              borderRadius: 8,
              minWidth: 200,
              cursor: "pointer",
              border: mission.id === currentMissionId ? "3px solid #fff" : "none",
              boxShadow: mission.id === currentMissionId ? "0 0 12px #fff" : undefined,
            }}
          >
            <h2 style={{ margin: 0 }}>{mission.title}</h2>
            <p style={{ margin: 0, fontSize: 14 }}>{mission.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";
import React from "react";
import type { Mission, MissionCategory } from "./types";
interface MissionOverviewProps {
  missions: Mission[];
  onClose: () => void;
  onSelectMission: (missionId: string) => void;
  currentMissionId?: string;
}
  physics: "#667eea",
  finance: "#48bb78",
  health: "#fc8181",
  spiritual: "#9f7aea",
  historical: "#ed8936",
export default function MissionOverview({ missions, onClose, onSelectMission, currentMissionId }: MissionOverviewProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", color: "white", padding: 20, overflowY: "auto", zIndex: 200, fontFamily: "Arial, sans-serif" }}>
      <button onClick={onClose} style={{ float: "right", fontSize: 24 }}>
        ×
const CATEGORY_COLORS: Record<MissionCategory, string> = {
  physics: "#667eea",
  finance: "#48bb78",
  health: "#fc8181",
  spiritual: "#9f7aea",
  historical: "#ed8936",
};
export default function MissionOverview({ missions, onClose, onSelectMission, currentMissionId }: MissionOverviewProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", color: "white", padding: 20, overflowY: "auto", zIndex: 200, fontFamily: "Arial, sans-serif" }}>
      <button onClick={onClose} style={{ float: "right", fontSize: 24 }}>
        ×
      </button>
      <h1 style={{ fontFamily: "Impact", fontSize: 36 }}>📋 MISSIONEN</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {missions.map((mission) => (
          <div
            key={mission.id}
            onClick={() => onSelectMission(mission.id)}
            style={{
              background: CATEGORY_COLORS[mission.category],
              color: "#fff",
              padding: 16,
              borderRadius: 8,
              minWidth: 200,
              cursor: "pointer",
              border: mission.id === currentMissionId ? "3px solid #fff" : "none",
              boxShadow: mission.id === currentMissionId ? "0 0 12px #fff" : undefined,
            }}
          >
            <h2 style={{ margin: 0 }}>{mission.title}</h2>
            <p style={{ margin: 0, fontSize: 14 }}>{mission.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";
<<<<<<< HEAD
import { PlayerProgress } from "./GameState";
import {
  getAllLessons,
  PHYSICS_PATH,
  SPIRITUAL_PATH,
  FINANCE_PATH,
  HEALTH_PATH,
} from "./LearningJourney";

export function MissionOverview({
  progress,
  onClose,
}: {
  progress: PlayerProgress;
  onClose: () => void;
}) {
  const paths = [
    {
      name: "🔵 Physik",
      lessons: PHYSICS_PATH,
      track: progress.learning.physics,
    },
    {
      name: "🟡 Finanzen",
      lessons: FINANCE_PATH,
      track: progress.learning.finance,
    },
    {
      name: "🔴 Gesundheit",

      "use client";
      import React from "react";
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

      export default function MissionOverview({ missions, onClose, onSelectMission, currentMissionId }: MissionOverviewProps) {
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", color: "white", padding: 20, overflowY: "auto", zIndex: 200, fontFamily: "Arial, sans-serif" }}>
            <button onClick={onClose} style={{ float: "right", fontSize: 24 }}>
              ×
            </button>
            <h1 style={{ fontFamily: "Impact", fontSize: 36 }}>📋 MISSIONEN</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  onClick={() => onSelectMission(mission.id)}
                  style={{
                    background: CATEGORY_COLORS[mission.category],
                    color: "#fff",
                    padding: 16,
                    borderRadius: 8,
                    minWidth: 200,
                    cursor: "pointer",
                    border: mission.id === currentMissionId ? "3px solid #fff" : "none",
                    boxShadow: mission.id === currentMissionId ? "0 0 12px #fff" : undefined,
                  }}
                >
                  <h2 style={{ margin: 0 }}>{mission.title}</h2>
                  <p style={{ margin: 0, fontSize: 14 }}>{mission.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {progress.twelveSteps.stepsCompleted.map((done, i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: done
                  ? "#4CAF50"
                  : i === progress.twelveSteps.currentStep
                  ? "#FFD700"
                  : "#444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <p>🗓️ {progress.twelveSteps.sobrietyDays} Tage clean</p>
      </div>

      {/* Learning Paths */}
      {paths.map((path) => (
        <div
          key={path.name}
          style={{
            background: "#222",
            padding: 15,
            marginBottom: 15,
            borderRadius: 8,
          }}
        >
          <h2>
            {path.name} - Level {path.track.level} ({path.track.xp} XP)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {path.lessons.map((lesson) => {
              const completed = path.track.lessonsCompleted.includes(lesson.id);
              const available = lesson.prerequisites.every((p) =>
                path.track.lessonsCompleted.includes(p),
              );
              return (
                <div
                  key={lesson.id}
                  style={{
                    padding: 10,
                    background: completed
                      ? "#2E7D32"
                      : available
                      ? "#1565C0"
                      : "#444",
                    borderRadius: 4,
                    opacity: available || completed ? 1 : 0.5,
                  }}
                >
                  {completed ? "✅" : available ? "▶️" : "🔒"} {lesson.titleDe}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
=======
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1a1a2e",
          borderRadius: "16px",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: "2px solid #333",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #333",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "24px" }}>
              📋 Missions
            </h2>
            <p style={{ margin: "5px 0 0", color: "#888", fontSize: "14px" }}>
              {completedCount}/{totalMissions} completed
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              fontSize: "24px",
              cursor: "pointer",
              padding: "5px 10px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Category Filter */}
        <div
          style={{
            padding: "10px 20px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            borderBottom: "1px solid #333",
          }}
        >
          <CategoryButton
            label="All"
            selected={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            color="#666"
          />
          {(Object.keys(CATEGORY_COLORS) as Array<MissionCategory>).map(
            (cat) => (
              <CategoryButton
                key={cat}
                label={`${CATEGORY_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                color={CATEGORY_COLORS[cat]}
              />
            ),
          )}
        </div>

        {/* Mission List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
        >
          {unlockedMissions.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              No missions available in this category
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {unlockedMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  isActive={mission.id === currentMissionId}
                  onClick={() => onSelectMission(mission.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "15px 20px",
            borderTop: "1px solid #333",
            color: "#666",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          Press M or ESC to close • Click a mission to track it
        </div>
      </div>
    </div>
  );
}

interface CategoryButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  color: string;
}

function CategoryButton({
  label,
  selected,
  onClick,
  color,
}: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: "20px",
        border: selected ? `2px solid ${color}` : "2px solid transparent",
        backgroundColor: selected ? `${color}22` : "#2a2a3e",
        color: selected ? color : "#888",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: selected ? "bold" : "normal",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

interface MissionCardProps {
  mission: Mission;
  isActive: boolean;
  onClick: () => void;
}

function MissionCard({ mission, isActive, onClick }: MissionCardProps) {
  const color = CATEGORY_COLORS[mission.category] || "#666";
  const icon = CATEGORY_ICONS[mission.category] || "📌";
  const completedObjectives = mission.objectives.filter(
    (o) => o.completed,
  ).length;
  const totalObjectives = mission.objectives.length;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: isActive ? `${color}22` : "#2a2a3e",
        border: isActive ? `2px solid ${color}` : "2px solid #3a3a4e",
        borderRadius: "12px",
        padding: "15px",
        cursor: "pointer",
        transition: "all 0.2s",
        opacity: mission.completed ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "5px",
            }}
          >
            <span style={{ fontSize: "18px" }}>{icon}</span>
            <h3
              style={{
                margin: 0,
                color: mission.completed ? "#666" : "#fff",
                fontSize: "16px",
                textDecoration: mission.completed ? "line-through" : "none",
              }}
            >
              {mission.title}
            </h3>
            {mission.stepNumber && (
              <span
                style={{
                  backgroundColor: color,
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                Step {mission.stepNumber}
              </span>
            )}
          </div>
          <p
            style={{
              margin: "0 0 10px 26px",
              color: "#888",
              fontSize: "13px",
            }}
          >
            {mission.description}
          </p>

          {/* Progress bar */}
          <div style={{ marginLeft: "26px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#666" }}>
                Objectives
              </span>
              <span style={{ fontSize: "11px", color: "#666" }}>
                {completedObjectives}/{totalObjectives}
              </span>
            </div>
            <div
              style={{
                height: "4px",
                backgroundColor: "#3a3a4e",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(completedObjectives / totalObjectives) * 100}%`,
                  backgroundColor: mission.completed ? "#48bb78" : color,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: mission.completed
              ? "#48bb78"
              : isActive
                ? color
                : "#3a3a4e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            marginLeft: "10px",
          }}
        >
          {mission.completed ? "✓" : isActive ? "►" : "○"}
        </div>
      </div>

      {/* Rewards */}
      {mission.reward && (
        <div
          style={{
            marginTop: "10px",
            marginLeft: "26px",
            display: "flex",
            gap: "15px",
            fontSize: "12px",
          }}
        >
          {mission.reward.xp && (
            <span style={{ color: "#9f7aea" }}>+{mission.reward.xp} XP</span>
          )}
          {mission.reward.money && (
            <span style={{ color: "#48bb78" }}>+€{mission.reward.money}</span>
          )}
          {mission.reward.item && (
            <span style={{ color: "#ed8936" }}>🎁 {mission.reward.item}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default MissionOverview;
>>>>>>> copilot/add-map-editor-page

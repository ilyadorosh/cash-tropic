"use client";
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
      lessons: HEALTH_PATH,
      track: progress.learning.health,
    },
    {
      name: "⚪ Spirituell",
      lessons: SPIRITUAL_PATH,
      track: progress.learning.spiritual,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0. 9)",
        color: "white",
        padding: 20,
        overflowY: "auto",
        zIndex: 200,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <button onClick={onClose} style={{ float: "right", fontSize: 24 }}>
        ✕
      </button>

      <h1 style={{ fontFamily: "Impact", fontSize: 36 }}>📋 MISSIONEN</h1>

      {/* 12 Steps Progress */}
      <div
        style={{
          background: "#222",
          padding: 15,
          marginBottom: 20,
          borderRadius: 8,
        }}
      >
        <h2>✝️ Die 12 Schritte</h2>
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

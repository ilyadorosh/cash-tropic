"use client";
import { PlayerProgress } from "./GameState";
import {
  PHYSICS_PATH,
  SPIRITUAL_PATH,
  FINANCE_PATH,
  HEALTH_PATH,
} from "./LearningJourney";
import { useState } from "react";

interface GameProgressPanelProps {
  progress: PlayerProgress;
  onClose: () => void;
}

type TabType =
  | "overview"
  | "learning"
  | "missions"
  | "recovery"
  | "relationships";

export function GameProgressPanel({
  progress,
  onClose,
}: GameProgressPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Übersicht", icon: "📊" },
    { id: "learning", label: "Lernen", icon: "📚" },
    { id: "missions", label: "Missionen", icon: "🎯" },
    { id: "recovery", label: "12 Schritte", icon: "✝️" },
    { id: "relationships", label: "Beziehungen", icon: "❤️" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.95)",
        color: "white",
        zIndex: 200,
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "15px 20px",
          background: "linear-gradient(to right, #1a1a2e, #16213e)",
          borderBottom: "2px solid #4CAF50",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "Impact, sans-serif",
            fontSize: 28,
            margin: 0,
            letterSpacing: 2,
          }}
        >
          🎮 SPIELER-PROFIL
        </h1>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: 28,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 5,
          padding: "10px 20px",
          background: "#1a1a2e",
          borderBottom: "1px solid #333",
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              background: activeTab === tab.id ? "#4CAF50" : "#333",
              border: "none",
              borderRadius: 4,
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? "bold" : "normal",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
        }}
      >
        {activeTab === "overview" && <OverviewTab progress={progress} />}
        {activeTab === "learning" && <LearningTab progress={progress} />}
        {activeTab === "missions" && <MissionsTab progress={progress} />}
        {activeTab === "recovery" && <RecoveryTab progress={progress} />}
        {activeTab === "relationships" && (
          <RelationshipsTab progress={progress} />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 20px",
          background: "#1a1a2e",
          borderTop: "1px solid #333",
          fontSize: 12,
          color: "#888",
        }}
      >
        Spielzeit: {formatPlayTime(progress.playTime)} | Zuletzt gespeichert:{" "}
        {new Date(progress.lastSaved).toLocaleString("de-DE")}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ progress }: { progress: PlayerProgress }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 15,
        }}
      >
        <StatCard label="Geld" value={`$${progress.money}`} color="#4CAF50" />
        <StatCard
          label="Gesundheit"
          value={`${progress.health}%`}
          color="#f44336"
        />
        <StatCard
          label="Respekt"
          value={progress.respect.toString()}
          color="#FFD700"
        />
        <StatCard
          label="Gesucht"
          value={"★".repeat(progress.wantedLevel) || "Sauber"}
          color="#ff9800"
        />
        <StatCard
          label="Nüchtern"
          value={`${progress.twelveSteps.sobrietyDays} Tage`}
          color="#9C27B0"
        />
        <StatCard
          label="Missionen"
          value={`${progress.completedMissions.length} ✓`}
          color="#2196F3"
        />
      </div>

      {/* Quick Summary */}
      <div
        style={{
          background: "#222",
          padding: 15,
          borderRadius: 8,
          borderLeft: "4px solid #4CAF50",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>📋 Zusammenfassung</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            Freigeschaltete Zonen: {(progress.unlockedZones ?? []).join(", ")}
          </li>
          <li>Eigentum: {(progress.ownedProperties ?? []).length} Objekte</li>
          <li>
            Aktuelle Mission:{" "}
            {progress.currentMission || "Keine aktive Mission"}
          </li>
          <li>
            12-Schritte Fortschritt: {progress.twelveSteps.currentStep}/12
          </li>
        </ul>
      </div>

      {/* Learning Overview */}
      <div
        style={{
          background: "#222",
          padding: 15,
          borderRadius: 8,
          borderLeft: "4px solid #2196F3",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>📚 Lernfortschritt</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {(["physics", "math", "finance", "health", "spiritual"] as const).map(
            (subject) => {
              const track = progress.learning[subject];
              const labels: Record<string, string> = {
                physics: "🔵 Physik",
                math: "🟢 Mathematik",
                finance: "🟡 Finanzen",
                health: "🔴 Gesundheit",
                spiritual: "⚪ Spirituell",
              };
              return (
                <div
                  key={subject}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ width: 100 }}>{labels[subject]}</span>
                  <ProgressBar
                    value={track.xp}
                    max={track.level * 100}
                    color={subject === "physics" ? "#2196F3" : "#4CAF50"}
                  />
                  <span style={{ fontSize: 12 }}>Lv.{track.level}</span>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}

// Learning Tab
function LearningTab({ progress }: { progress: PlayerProgress }) {
  const paths = [
    {
      name: "🔵 Physik",
      lessons: PHYSICS_PATH,
      track: progress.learning.physics,
      color: "#2196F3",
    },
    {
      name: "🟡 Finanzen",
      lessons: FINANCE_PATH,
      track: progress.learning.finance,
      color: "#FFD700",
    },
    {
      name: "🔴 Gesundheit",
      lessons: HEALTH_PATH,
      track: progress.learning.health,
      color: "#f44336",
    },
    {
      name: "⚪ Spirituell",
      lessons: SPIRITUAL_PATH,
      track: progress.learning.spiritual,
      color: "#9C27B0",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {paths.map((path) => (
        <div
          key={path.name}
          style={{
            background: "#222",
            padding: 15,
            borderRadius: 8,
            borderLeft: `4px solid ${path.color}`,
          }}
        >
          <h2 style={{ margin: "0 0 10px 0" }}>
            {path.name} - Level {path.track.level}
          </h2>
          <ProgressBar
            value={path.track.xp}
            max={path.track.level * 100}
            color={path.color}
            height={10}
          />
          <p style={{ fontSize: 12, color: "#888", marginTop: 5 }}>
            {path.track.xp}/{path.track.level * 100} XP zum nächsten Level
          </p>

          {/* Lessons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 15,
            }}
          >
            {path.lessons.map((lesson) => {
              const completed = path.track.lessonsCompleted.includes(lesson.id);
              const available = lesson.prerequisites.every((p) =>
                path.track.lessonsCompleted.includes(p),
              );
              const score = path.track.quizScores[lesson.id];
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
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {completed ? "✅" : available ? "▶️" : "🔒"}{" "}
                    {lesson.titleDe}
                  </span>
                  {score !== undefined && (
                    <span style={{ fontSize: 12 }}>{score}%</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Achievements */}
          {path.track.achievements.length > 0 && (
            <div style={{ marginTop: 15 }}>
              <h4 style={{ margin: "0 0 5px 0" }}>🏆 Erfolge</h4>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {path.track.achievements.map((ach) => (
                  <span
                    key={ach}
                    style={{
                      padding: "4px 8px",
                      background: "#FFD700",
                      color: "#000",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {ach}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Missions Tab
function MissionsTab({ progress }: { progress: PlayerProgress }) {
  // Define some known missions
  const knownMissions = [
    {
      id: "meet_og_loc",
      name: "Homies & Hallucinations",
      zone: "Grove Street",
    },
    { id: "meet_maria", name: "Burning Heart", zone: "Downtown" },
    { id: "the_confession", name: "The Confession", zone: "Kirche" },
    { id: "thief_mission", name: "Der Dieb", zone: "Hafen" },
    { id: "physics_intro", name: "Einführung Physik", zone: "Universität" },
    { id: "finance_basics", name: "Finanz-Grundlagen", zone: "Bank" },
  ];

  const completedSet = new Set(progress.completedMissions);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Current Mission */}
      {progress.currentMission && (
        <div
          style={{
            background: "linear-gradient(to right, #1565C0, #0D47A1)",
            padding: 15,
            borderRadius: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>🎯 Aktive Mission</h3>
          <p style={{ fontSize: 18, margin: "10px 0 0 0" }}>
            {progress.currentMission}
          </p>
        </div>
      )}

      {/* Completed Missions */}
      <div
        style={{
          background: "#222",
          padding: 15,
          borderRadius: 8,
          borderLeft: "4px solid #4CAF50",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0" }}>
          ✅ Abgeschlossen ({progress.completedMissions.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {knownMissions.map((mission) => {
            const completed = completedSet.has(mission.id);
            return (
              <div
                key={mission.id}
                style={{
                  padding: 10,
                  background: completed ? "#2E7D32" : "#333",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  opacity: completed ? 1 : 0.5,
                }}
              >
                <span>
                  {completed ? "✅" : "⬜"} {mission.name}
                </span>
                <span style={{ fontSize: 12, color: "#888" }}>
                  {mission.zone}
                </span>
              </div>
            );
          })}
          {/* Show any additional completed missions not in our known list */}
          {progress.completedMissions
            .filter((m) => !knownMissions.find((km) => km.id === m))
            .map((missionId) => (
              <div
                key={missionId}
                style={{
                  padding: 10,
                  background: "#2E7D32",
                  borderRadius: 4,
                }}
              >
                ✅ {missionId}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Recovery Tab (12 Steps)
function RecoveryTab({ progress }: { progress: PlayerProgress }) {
  const stepNames = [
    "Machtlosigkeit zugeben",
    "An höhere Macht glauben",
    "Entscheidung treffen",
    "Inventur machen",
    "Fehler eingestehen",
    "Bereit für Veränderung",
    "Höhere Macht bitten",
    "Liste der Verletzten",
    "Wiedergutmachung wo möglich",
    "Tägliche Inventur",
    "Meditation & Gebet",
    "Anderen helfen",
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Sobriety Counter */}
      <div
        style={{
          background: "linear-gradient(to right, #9C27B0, #673AB7)",
          padding: 20,
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>🗓️ Nüchternheit</h2>
        <div style={{ fontSize: 48, fontWeight: "bold", margin: "10px 0" }}>
          {progress.twelveSteps.sobrietyDays}
        </div>
        <p style={{ margin: 0, opacity: 0.8 }}>Tage clean</p>
      </div>

      {/* Sponsor */}
      {progress.twelveSteps.sponsor && (
        <div
          style={{
            background: "#222",
            padding: 15,
            borderRadius: 8,
            borderLeft: "4px solid #9C27B0",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>👤 Sponsor</h3>
          <p style={{ margin: 0, fontSize: 18 }}>
            {progress.twelveSteps.sponsor}
          </p>
        </div>
      )}

      {/* 12 Steps Progress */}
      <div
        style={{
          background: "#222",
          padding: 15,
          borderRadius: 8,
          borderLeft: "4px solid #FFD700",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0" }}>
          ✝️ Die 12 Schritte ({progress.twelveSteps.currentStep}/12)
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stepNames.map((name, i) => {
            const done = progress.twelveSteps.stepsCompleted[i];
            const current = i === progress.twelveSteps.currentStep;
            return (
              <div
                key={i}
                style={{
                  padding: 10,
                  background: done ? "#2E7D32" : current ? "#FFD700" : "#333",
                  color: current && !done ? "#000" : "#fff",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: done ? "#4CAF50" : current ? "#fff" : "#555",
                    color: done || current ? "#000" : "#888",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: 12,
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span>{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Amends Made */}
      {(progress.twelveSteps.amends ?? []).length > 0 && (
        <div
          style={{
            background: "#222",
            padding: 15,
            borderRadius: 8,
            borderLeft: "4px solid #4CAF50",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>🤝 Wiedergutmachung</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(progress.twelveSteps.amends ?? []).map((npcId) => (
              <span
                key={npcId}
                style={{
                  padding: "4px 12px",
                  background: "#4CAF50",
                  borderRadius: 20,
                  fontSize: 14,
                }}
              >
                ✓ {npcId}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Relationships Tab
function RelationshipsTab({ progress }: { progress: PlayerProgress }) {
  // Map NPC IDs to display names
  const npcNames: Record<string, { name: string; role: string }> = {
    MARLENE: { name: "Marlene", role: "Freundin" },
    PFARRER_MUELLER: { name: "Pfarrer Müller", role: "Kirchenoberhaupt" },
    MC_LUKAS: { name: "MC Lukas", role: "Rapper" },
    PROFESSOR_WEBER: { name: "Prof. Weber", role: "Physik-Professor" },
    SPONSOR_KLAUS: { name: "Klaus", role: "AA-Sponsor" },
    MARIA: { name: "Maria", role: "Love Interest" },
    OG_LOC: { name: "OG Loc", role: "Homie" },
    THE_THIEF: { name: "Der Dieb", role: "Unbekannt" },
    FATHER_MARTINEZ: { name: "Vater Martinez", role: "Priester" },
    DOCTOR_MUELLER: { name: "Dr. Müller", role: "Arzt" },
  };

  const relationships = Object.entries(progress.relationships).sort(
    ([, a], [, b]) => b - a,
  );

  return (
    <div style={{ display: "grid", gap: 15 }}>
      <h3 style={{ margin: 0 }}>❤️ NPC-Beziehungen</h3>
      {relationships.map(([npcId, affection]) => {
        const npc = npcNames[npcId] || { name: npcId, role: "NPC" };
        const color =
          affection >= 80
            ? "#4CAF50"
            : affection >= 60
            ? "#8BC34A"
            : affection >= 40
            ? "#FFC107"
            : affection >= 20
            ? "#FF9800"
            : "#f44336";

        return (
          <div
            key={npcId}
            style={{
              background: "#222",
              padding: 15,
              borderRadius: 8,
              borderLeft: `4px solid ${color}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div>
                <span style={{ fontSize: 16, fontWeight: "bold" }}>
                  {npc.name}
                </span>
                <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                  {npc.role}
                </span>
              </div>
              <span style={{ fontSize: 18, fontWeight: "bold", color }}>
                {affection}%
              </span>
            </div>
            <ProgressBar value={affection} max={100} color={color} height={8} />
            <div
              style={{
                fontSize: 12,
                color: "#888",
                marginTop: 5,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                {affection >= 80
                  ? "💚 Beste Freunde"
                  : affection >= 60
                  ? "💙 Gute Beziehung"
                  : affection >= 40
                  ? "💛 Neutral"
                  : affection >= 20
                  ? "🧡 Distanziert"
                  : "❤️ Feindlich"}
              </span>
              {(progress.twelveSteps.amends ?? []).includes(npcId) && (
                <span style={{ color: "#4CAF50" }}>✓ Wiedergutmachung</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper Components
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#222",
        padding: 15,
        borderRadius: 8,
        borderTop: `3px solid ${color}`,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color,
  height = 6,
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
}) {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "#444",
        borderRadius: height / 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          background: color,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

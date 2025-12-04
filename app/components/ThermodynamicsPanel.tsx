"use client";

import React, { useState } from "react";
import { PhysicsExplainer, PHYSICS_PRESETS } from "./PhysicsExplainer";

type PhysicsTopic = "entropy" | "temperature" | "energy";

interface ThermodynamicsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTopic?: PhysicsTopic | null;
  onSelectTopic?: (topic: PhysicsTopic) => void;
  energyBalance?: {
    production: number;
    consumption: number;
    balance: number;
  };
  currentEntropy?: number;
  className?: string;
}

/**
 * ThermodynamicsPanel is an interactive side panel for exploring physics concepts
 * Integrates with the 3D visualizer to show real-time thermodynamic data
 */
export function ThermodynamicsPanel({
  isOpen,
  onClose,
  selectedTopic = "entropy",
  onSelectTopic,
  energyBalance,
  currentEntropy,
  className = "",
}: ThermodynamicsPanelProps) {
  const [internalTopic, setInternalTopic] = useState<PhysicsTopic>("entropy");

  const topic = selectedTopic ?? internalTopic;
  const handleTopicSelect = onSelectTopic ?? setInternalTopic;

  if (!isOpen) return null;

  const topics = [
    { id: "entropy" as const, label: "Entropy", icon: "🌀" },
    { id: "temperature" as const, label: "Temperature", icon: "🌡️" },
    { id: "energy" as const, label: "Energy", icon: "⚡" },
  ];

  return (
    <div
      className={`thermodynamics-panel ${className}`}
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: "min(400px, 90vw)",
        height: "100%",
        background: "rgba(10, 10, 26, 0.98)",
        borderLeft: "1px solid rgba(100, 100, 255, 0.3)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflowY: "auto",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(100, 100, 255, 0.2)",
          background: "rgba(30, 30, 60, 0.5)",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#88aaff",
            fontSize: "1.25rem",
            fontWeight: 600,
          }}
        >
          Thermodynamics Lab
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255, 100, 100, 0.2)",
            border: "1px solid rgba(255, 100, 100, 0.3)",
            borderRadius: "6px",
            color: "#ff8888",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Real-time Stats */}
      {(energyBalance || currentEntropy !== undefined) && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(100, 100, 255, 0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#aaccff",
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Live Simulation Data
          </h3>

          {energyBalance && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
              }}
            >
              <StatCard
                label="Production"
                value={energyBalance.production.toFixed(0)}
                unit="MW"
                color="#66ff88"
              />
              <StatCard
                label="Consumption"
                value={energyBalance.consumption.toFixed(0)}
                unit="MW"
                color="#ff6688"
              />
              <StatCard
                label="Balance"
                value={
                  (energyBalance.balance >= 0 ? "+" : "") +
                  energyBalance.balance.toFixed(0)
                }
                unit="MW"
                color={energyBalance.balance >= 0 ? "#66ff88" : "#ff6688"}
              />
            </div>
          )}

          {currentEntropy !== undefined && (
            <StatCard
              label="System Entropy"
              value={currentEntropy.toFixed(2)}
              unit="k_B"
              color="#ffaa66"
              fullWidth
            />
          )}
        </div>
      )}

      {/* Topic Tabs */}
      <div
        style={{
          display: "flex",
          padding: "12px 20px",
          gap: "8px",
          borderBottom: "1px solid rgba(100, 100, 255, 0.15)",
        }}
      >
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTopicSelect(t.id)}
            style={{
              flex: 1,
              padding: "10px 8px",
              background:
                topic === t.id
                  ? "rgba(100, 100, 255, 0.3)"
                  : "rgba(50, 50, 80, 0.3)",
              border:
                topic === t.id
                  ? "1px solid rgba(100, 100, 255, 0.5)"
                  : "1px solid rgba(100, 100, 255, 0.15)",
              borderRadius: "8px",
              color: topic === t.id ? "#aaccff" : "#888",
              cursor: "pointer",
              fontSize: "0.85rem",
              transition: "all 0.2s ease",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
        }}
      >
        {topic && PHYSICS_PRESETS[topic] && (
          <PhysicsExplainer
            title={PHYSICS_PRESETS[topic].title}
            content={PHYSICS_PRESETS[topic].content}
            equations={PHYSICS_PRESETS[topic].equations}
          />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(100, 100, 255, 0.15)",
          background: "rgba(30, 30, 60, 0.3)",
          fontSize: "0.75rem",
          color: "#666",
          textAlign: "center",
        }}
      >
        Energy is information. Entropy is information. Temperature is a
        statistical equalizer.
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  color = "#88aaff",
  fullWidth = false,
}: {
  label: string;
  value: string;
  unit: string;
  color?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(50, 50, 80, 0.4)",
        borderRadius: "8px",
        padding: "10px",
        textAlign: "center",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <div style={{ fontSize: "0.7rem", color: "#888", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.25rem", color, fontWeight: 600 }}>
        {value}
        <span style={{ fontSize: "0.7rem", color: "#888", marginLeft: "4px" }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

export default ThermodynamicsPanel;

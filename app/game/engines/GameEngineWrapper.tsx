"use client";

// GameEngineWrapper.tsx - React wrapper for the modular engine system

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  EngineType,
  MapType,
  EngineConfig,
  IGameEngine,
  EngineRegistry,
  defaultMapLoader,
  DEFAULT_ENGINE_FEATURES,
  Three3DEngine,
} from "./index";
import { GameStats, Dialogue } from "../types";

// Register engines on module load (client-side only)
if (typeof window !== "undefined") {
  EngineRegistry.register("three3d", () => new Three3DEngine());
}

export interface GameEngineWrapperProps {
  engineType?: EngineType;
  mapType?: MapType;
  customMapId?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

/**
 * React component that wraps the modular game engine system.
 * Provides a simple interface for embedding the game in React applications.
 */
export function GameEngineWrapper({
  engineType = "three3d",
  mapType = "nuernberg",
  customMapId,
  onReady,
  onError,
}: GameEngineWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<IGameEngine | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>({
    speed: "0",
    health: 100,
    mission: 0,
    money: 500,
    wanted: 0,
    isCutscene: false,
    respect: 0,
    relationship: 50,
  });
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: string;
      title: string;
      subtitle?: string;
      opacity: number;
    }>
  >([]);

  // Notification handler
  const showNotification = useCallback(
    (type: string, title: string, subtitle?: string) => {
      const id = `notif_${Date.now()}`;
      setNotifications((prev) => [
        ...prev,
        { id, type, title, subtitle, opacity: 1 },
      ]);

      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, opacity: 0 } : n)),
        );
      }, 5500);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6000);
    },
    [],
  );

  // Initialize engine
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initEngine = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create engine instance
        const engine = EngineRegistry.create(engineType);
        engineRef.current = engine;

        // Configure engine
        const config: EngineConfig = {
          engineType,
          mapType,
          features: DEFAULT_ENGINE_FEATURES,
          locale: mapType === "nuernberg" ? "de-DE" : "en-US",
        };

        // Set up callbacks
        engine.onDialogue(setDialogue);
        engine.onNotification(showNotification);
        engine.onStatsUpdate(setStats);

        // Initialize engine
        await engine.initialize(config, container);

        // Load map
        let mapConfig;
        if (customMapId) {
          mapConfig = await defaultMapLoader.loadCustomMap(customMapId);
          if (!mapConfig) {
            throw new Error(`Custom map "${customMapId}" not found`);
          }
        } else {
          mapConfig = await defaultMapLoader.loadMap(mapType);
        }

        await engine.loadMap(mapConfig);

        // Start the game
        engine.start();

        setIsLoading(false);
        onReady?.();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    initEngine();

    // Cleanup
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [engineType, mapType, customMapId, onReady, onError, showNotification]);

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;

      // Map keyboard to game input
      const key = e.key.toLowerCase();

      // Movement keys
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
        ].includes(key)
      ) {
        const x =
          key === "a" || key === "arrowleft"
            ? -1
            : key === "d" || key === "arrowright"
            ? 1
            : 0;
        const y =
          key === "w" || key === "arrowup"
            ? 1
            : key === "s" || key === "arrowdown"
            ? -1
            : 0;
        engineRef.current.handleInput({
          type: "move",
          data: { x, y, sprint: e.shiftKey },
        });
      }

      // Action keys
      if (key === "e") {
        engineRef.current.handleInput({
          type: "action",
          data: { action: "interact" },
        });
      } else if (key === "f") {
        engineRef.current.handleInput({
          type: "action",
          data: { action: "shoot" },
        });
      } else if (key === " ") {
        e.preventDefault();
        engineRef.current.handleInput({
          type: "action",
          data: { action: "brake" },
        });
      } else if (key === "m") {
        engineRef.current.handleInput({
          type: "action",
          data: { action: "mission_menu" },
        });
      } else if (key === "escape") {
        engineRef.current.handleInput({
          type: "action",
          data: { action: "pause" },
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      // Reset movement on key up
      const key = e.key.toLowerCase();
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
        ].includes(key)
      ) {
        engineRef.current.handleInput({
          type: "move",
          data: { x: 0, y: 0 },
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#000",
      }}
    >
      {/* Game Container */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100vh", position: "relative" }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: "Impact, sans-serif",
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "20px",
              textShadow: "0 0 20px #4caf50",
            }}
          >
            Loading...
          </div>
          <div style={{ fontSize: "18px", color: "#aaa" }}>
            Initializing {engineType} engine with {mapType} map
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(100,0,0,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: "monospace",
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "20px" }}>
            ⚠️ Engine Error
          </div>
          <div
            style={{ fontSize: "16px", maxWidth: "600px", textAlign: "center" }}
          >
            {error}
          </div>
        </div>
      )}

      {/* HUD - Stats */}
      {!isLoading && !error && !stats.isCutscene && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            fontFamily: "Impact, sans-serif",
            color: "white",
            textShadow: "2px 2px 0 #000",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "40px", color: "#4caf50" }}>
              ${stats.money}
            </span>
            <span style={{ fontSize: "24px" }}>
              {stats.speed} <span style={{ fontSize: "14px" }}>MPH</span>
            </span>
          </div>

          {/* Wanted Stars */}
          <div style={{ fontSize: "24px", color: "#ffeb3b" }}>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <span
                  key={i}
                  style={{
                    opacity: i < stats.wanted ? 1 : 0.2,
                    filter:
                      i < stats.wanted ? "drop-shadow(0 0 5px gold)" : "none",
                  }}
                >
                  ★
                </span>
              ))}
          </div>

          {/* Health Bar */}
          <div
            style={{
              width: "250px",
              height: "20px",
              background: "#222",
              border: "2px solid #fff",
              marginTop: "5px",
              transform: "skewX(-20deg)",
            }}
          >
            <div
              style={{
                width: `${Math.max(0, stats.health)}%`,
                height: "100%",
                background: stats.health < 30 ? "#ff3333" : "#d32f2f",
                transition: "width 0.2s",
              }}
            />
          </div>
        </div>
      )}

      {/* Dialogue Box */}
      {dialogue && (
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "70%",
            background:
              "linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.7))",
            borderLeft: "8px solid #4caf50",
            padding: "25px",
            color: "white",
            fontFamily: "monospace",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            zIndex: 20,
          }}
        >
          <h3
            style={{
              margin: "0 0 10px 0",
              color: "#4caf50",
              fontSize: "24px",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {dialogue.title}
          </h3>
          <p style={{ fontSize: "20px", lineHeight: "1.5", margin: 0 }}>
            {dialogue.text}
          </p>
        </div>
      )}

      {/* Notifications */}
      <div
        style={{
          position: "absolute",
          bottom: "25%",
          right: "30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              opacity: notif.opacity,
              transition: "opacity 0.5s ease-out",
              textAlign: "right",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            }}
          >
            <div
              style={{
                fontFamily: "Impact, sans-serif",
                fontSize: "36px",
                color: "#fff",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {notif.title}
            </div>
            {notif.subtitle && (
              <div
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "16px",
                  color: "#ffcc00",
                  fontStyle: "italic",
                }}
              >
                {notif.subtitle}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "14px",
          color: "#ccc",
          fontFamily: "monospace",
          background: "rgba(0,0,0,0.5)",
          padding: "5px 10px",
          borderRadius: 4,
        }}
      >
        [WASD] Move | [E] Interact | [F] Shoot | [SPACE] Brake | [M] Missions
      </div>
    </div>
  );
}

export default GameEngineWrapper;

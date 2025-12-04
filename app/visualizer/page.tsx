"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import * as THREE from "three";
import dynamic from "next/dynamic";
import styles from "./visualizer.module.scss";

// Dynamic imports for Three.js components (they use browser APIs)
const ThreeScene = dynamic(
  () => import("../components/EnergyVisualization/ThreeScene"),
  { ssr: false },
);

const ThermodynamicsPanel = dynamic(
  () => import("../components/ThermodynamicsPanel"),
  { ssr: false },
);

const ModelSwitcher = dynamic(() => import("../components/ModelSwitcher"), {
  ssr: false,
});

// Import classes directly for use in callbacks
import { EnergyParticleSystem } from "../components/EnergyVisualization/EnergyParticles";
import { EntropyGradient } from "../components/EnergyVisualization/EntropyGradient";
import {
  ModelArchitecture,
  PRESET_ARCHITECTURES,
} from "../components/EnergyVisualization/ModelArchitecture";
import { CivilizationGrid } from "../components/EnergyVisualization/CivilizationGrid";

type VisualizationMode = "energy" | "entropy" | "model" | "civilization";

export default function VisualizerPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<VisualizationMode>("civilization");
  const [showPhysicsPanel, setShowPhysicsPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [currentModel, setCurrentModel] = useState("gpt-4");
  const [physicsTopic, setPhysicsTopic] = useState<
    "entropy" | "temperature" | "energy"
  >("entropy");

  // Stats
  const [energyBalance, setEnergyBalance] = useState({
    production: 0,
    consumption: 0,
    balance: 0,
  });
  const [entropy, setEntropy] = useState(0);
  const [fps, setFps] = useState(0);

  // Refs for visualization systems
  const particleSystemRef = useRef<EnergyParticleSystem | null>(null);
  const entropyGradientRef = useRef<EntropyGradient | null>(null);
  const modelArchitectureRef = useRef<ModelArchitecture | null>(null);
  const civilizationGridRef = useRef<CivilizationGrid | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  // Hide help after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelp(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const updateVisibility = useCallback((_newMode: VisualizationMode) => {
    // This would control visibility of different visualizations
    // For now, all run simultaneously to show the full system
  }, []);

  const handleSceneReady = useCallback(
    (
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      renderer: THREE.WebGLRenderer,
    ) => {
      sceneRef.current = scene;

      // Initialize all visualization systems
      particleSystemRef.current = new EnergyParticleSystem(scene, {
        particleCount: 800,
        emitterPosition: new THREE.Vector3(0, 20, 0),
        emitterRadius: 8,
      });

      entropyGradientRef.current = new EntropyGradient(scene, {
        gridSize: 25,
        cellSize: 2,
      });
      // Add moving heat sources for dynamic visualization
      entropyGradientRef.current.addHeatSource(15, 15, 80);
      entropyGradientRef.current.addHeatSource(-15, -10, 60);

      modelArchitectureRef.current = new ModelArchitecture(scene, {
        ...PRESET_ARCHITECTURES.custom,
        spacing: 10,
        nodeSize: 0.6,
      });
      modelArchitectureRef.current.setPosition(-30, 15, 30);

      civilizationGridRef.current = new CivilizationGrid(scene, {
        gridSize: 15,
        cellSize: 3,
      });

      // Set initial visibility based on mode
      updateVisibility(mode);

      setIsLoading(false);
    },
    [mode, updateVisibility],
  );

  const handleAnimate = useCallback((delta: number) => {
    // Update FPS counter
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFrameTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    // Update visualization systems
    particleSystemRef.current?.update(delta);
    entropyGradientRef.current?.update(delta);
    modelArchitectureRef.current?.update(delta);
    civilizationGridRef.current?.update(delta);

    // Update stats periodically
    if (Math.random() < 0.1) {
      // ~10% of frames
      if (civilizationGridRef.current) {
        setEnergyBalance(civilizationGridRef.current.getEnergyBalance());
      }
      if (entropyGradientRef.current) {
        setEntropy(entropyGradientRef.current.getTotalEntropy());
      }
    }
  }, []);

  const handleModeChange = useCallback(
    (newMode: VisualizationMode) => {
      setMode(newMode);
      updateVisibility(newMode);

      // Update physics topic based on mode
      if (newMode === "entropy") {
        setPhysicsTopic("entropy");
      } else if (newMode === "energy" || newMode === "civilization") {
        setPhysicsTopic("energy");
      }
    },
    [updateVisibility],
  );

  return (
    <div className={styles["visualizer-container"]}>
      {/* Three.js Canvas */}
      <ThreeScene
        className={styles["visualizer-canvas"]}
        onSceneReady={handleSceneReady}
        onAnimate={handleAnimate}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className={styles["loading-overlay"]}>
          <div className={styles["loading-spinner"]} />
          <div className={styles["loading-text"]}>
            Initializing Energy Visualization...
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className={styles["visualizer-overlay"]}>
        {/* Header */}
        <header className={styles["visualizer-header"]}>
          <div className={styles["visualizer-title"]}>
            <h1>Energy-Based Civilization Visualizer</h1>
            <p>
              Energy is information. Entropy is information. Temperature is a
              statistical equalizer.
            </p>
          </div>

          <nav className={styles["visualizer-nav"]}>
            <Link href="/" className={styles["nav-button"]}>
              💬 Chat
            </Link>
            <Link
              href="/visualizer"
              className={`${styles["nav-button"]} ${styles.active}`}
            >
              🌌 Visualizer
            </Link>
            <Link href="/game" className={styles["nav-button"]}>
              🎮 Game
            </Link>
            <Link href="/admin/profiles" className={styles["nav-button"]}>
              ⚙️ Admin
            </Link>
          </nav>
        </header>

        {/* Help Tooltip */}
        {showHelp && (
          <div className={styles["help-tooltip"]}>
            <h4>🎮 Controls</h4>
            <ul>
              <li>
                <code>Drag</code> to orbit camera
              </li>
              <li>
                <code>Scroll</code> to zoom in/out
              </li>
              <li>
                <code>Touch</code> gestures on mobile
              </li>
            </ul>
            <p style={{ marginTop: "8px", color: "#666", fontSize: "0.75rem" }}>
              Click anywhere to dismiss
            </p>
          </div>
        )}

        {/* Left Controls */}
        <div className={styles["visualizer-controls"]}>
          <div className={styles["control-group"]}>
            <h3>Visualization Mode</h3>
            {[
              {
                id: "civilization" as const,
                label: "Civilization",
                icon: "🏙️",
              },
              { id: "energy" as const, label: "Energy Particles", icon: "⚡" },
              { id: "entropy" as const, label: "Entropy Map", icon: "🌡️" },
              { id: "model" as const, label: "AI Architecture", icon: "🧠" },
            ].map((m) => (
              <button
                key={m.id}
                className={`${styles["control-button"]} ${
                  mode === m.id ? styles.active : ""
                }`}
                onClick={() => handleModeChange(m.id)}
              >
                <span className={styles["control-button-icon"]}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          <div className={styles["control-group"]}>
            <h3>AI Model</h3>
            <div className={styles["model-switcher-container"]}>
              <ModelSwitcher
                currentModel={currentModel}
                onModelSelect={setCurrentModel}
              />
            </div>
          </div>
        </div>

        {/* Right Stats */}
        <div className={styles["visualizer-stats"]}>
          <div className={styles["stat-row"]}>
            <span className={styles["stat-label"]}>Mode</span>
            <span className={styles["stat-value"]}>{mode}</span>
          </div>
          <div className={styles["stat-row"]}>
            <span className={styles["stat-label"]}>FPS</span>
            <span className={styles["stat-value"]}>{fps}</span>
          </div>
          <div className={styles["stat-row"]}>
            <span className={styles["stat-label"]}>Energy</span>
            <span
              className={`${styles["stat-value"]} ${
                energyBalance.balance >= 0 ? styles.positive : styles.negative
              }`}
            >
              {energyBalance.balance >= 0 ? "+" : ""}
              {energyBalance.balance.toFixed(0)} MW
            </span>
          </div>
          <div className={styles["stat-row"]}>
            <span className={styles["stat-label"]}>Entropy</span>
            <span className={styles["stat-value"]}>
              {entropy.toFixed(1)} k<sub>B</sub>
            </span>
          </div>
          <div className={styles["stat-row"]}>
            <span className={styles["stat-label"]}>Model</span>
            <span className={styles["stat-value"]}>{currentModel}</span>
          </div>
        </div>

        {/* Physics Panel Toggle */}
        <div className={styles["physics-panel-toggle"]}>
          <button
            className={styles["panel-toggle-button"]}
            onClick={() => setShowPhysicsPanel(!showPhysicsPanel)}
          >
            📐 {showPhysicsPanel ? "Hide" : "Show"} Physics
          </button>
        </div>
      </div>

      {/* Thermodynamics Panel */}
      <ThermodynamicsPanel
        isOpen={showPhysicsPanel}
        onClose={() => setShowPhysicsPanel(false)}
        selectedTopic={physicsTopic}
        onSelectTopic={setPhysicsTopic}
        energyBalance={energyBalance}
        currentEntropy={entropy}
      />
    </div>
  );
}

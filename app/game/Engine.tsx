"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { initWorld, MAP_LAYOUT } from "./World";
import { GameStats, Dialogue, DialogueOption } from "./types";
import {
  PLAYER_SPAWN,
  ROADS,
  LOCATIONS,
  ZONES,
  NO_BUILD_ZONES,
  isInNoBuildZone,
} from "./NuernbergMap";

import {
  CHARACTERS,
  THIEF_MISSION_DIALOGUE,
  MARIA_DIALOGUE,
  POLICE_DIALOGUE,
  EDUCATIONAL_NPCS,
} from "./Characters";
import { AIAgentSystem } from "./AIAgentSystem";
import { PoliceSystem } from "./PoliceSystem";
import { MissionSystem } from "./MissionSystem";
import { ProceduralCity, Building } from "./ProceduralCity";
// Add imports at top:
import {
  NUERNBERG_STREETS,
  generateCityBlocks,
  CityBlock,
  BuildingPlot,
} from "./CityLayout";
import { CityDatabase } from "./CityDatabase";
import { TrafficSystem } from "./TrafficSystem";
// Add import
import { InteriorSystem } from "./InteriorSystem";
// Add to Engine.tsx imports:
import { GameManager } from "./GameManager";
import { getAllLessons, getNextLesson, Lesson } from "./LearningJourney";
// Add these imports
import { MobileControls } from "./MobileControls";
import { MissionOverview } from "./MissionOverview";
import { PrayerModal } from "./PrayerModal";
import { NeuralCity } from "./NeuralCity";

// === AUDIO UTILITIES ===
const speak = (text: string, pitch = 1, rate = 1) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = pitch;
  u.rate = rate;
  u.lang = "de-DE"; // German!

  // Try to get a German voice
  const voices = window.speechSynthesis.getVoices();
  const germanVoice = voices.find((v) => v.lang.startsWith("de"));
  if (germanVoice) {
    u.voice = germanVoice;
  }

  window.speechSynthesis.speak(u);
};

const audioCtx =
  typeof window !== "undefined"
    ? new (window.AudioContext || (window as any).webkitAudioContext)()
    : null;
let sirenOsc: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;

const toggleSiren = (active: boolean) => {
  if (!audioCtx) return;
  if (active && !sirenOsc) {
    sirenOsc = audioCtx.createOscillator();
    sirenGain = audioCtx.createGain();
    sirenOsc.type = "sawtooth";
    sirenOsc.frequency.value = 600;
    sirenOsc.connect(sirenGain);
    sirenGain.connect(audioCtx.destination);
    sirenGain.gain.value = 0.1;
    sirenOsc.start();
  } else if (!active && sirenOsc) {
    sirenOsc.stop();
    sirenOsc.disconnect();
    sirenOsc = null;
  }
};

// === LLM INTEGRATION ===
// Connect to your cash-tropic backend or use local fallback
const LLM_ENDPOINT =
  process.env.NEXT_PUBLIC_LLM_ENDPOINT || "/api/characterThink";

async function callLLM(
  character: string,
  context: string,
  systemPrompt: string,
): Promise<string> {
  try {
    const res = await fetch(LLM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character, context, systemPrompt }),
    });
    const data = await res.json();
    return data.response || data.text || "... ";
  } catch (e) {
    console.error("LLM call failed:", e);
    // Fallback to character's default lines
    const char = CHARACTERS[character];
    if (char?.defaultLines) {
      return char.defaultLines[
        Math.floor(Math.random() * char.defaultLines.length)
      ];
    }
    return "...";
  }
}

export default function GTAEngine() {
  const mountRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const cityRef = useRef<ProceduralCity | null>(null);

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
  const [onFoot, setOnFoot] = useState(false);
  const [showSurrenderPrompt, setShowSurrenderPrompt] = useState(false);

  // Add refs:
  const cityDbRef = useRef<CityDatabase | null>(null);
  const trafficRef = useRef<TrafficSystem | null>(null);
  const cityBlocksRef = useRef<CityBlock[]>([]);

  // Add ref
  const interiorRef = useRef<InteriorSystem | null>(null);

  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "location" | "business" | "zone" | "money" | "mission";
      title: string;
      subtitle?: string;
      opacity: number;
    }>
  >([]);

  // Systems refs (persist across renders)
  const aiSystemRef = useRef<AIAgentSystem | null>(null);
  const policeSystemRef = useRef<PoliceSystem | null>(null);
  const missionSystemRef = useRef<MissionSystem | null>(null);

  // Add ref:
  const gameManagerRef = useRef<GameManager | null>(null);
  // Add state for mobile and mission overview
  const [isMobile, setIsMobile] = useState(false);
  const [showMissions, setShowMissions] = useState(false);

  // === ADD THESE REFS AT THE TOP OF THE COMPONENT (outside useEffect) ===
  const keysRef = useRef<Record<string, boolean>>({});
  const onKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // Add ref
  const neuralCityRef = useRef<NeuralCity | null>(null);

  // Add state
  const [showPrayerModal, setShowPrayerModal] = useState(false);

  // Dialogue handler with options support
  const handleDialogue = useCallback((d: Dialogue) => {
    setDialogue(d);
    if (d.text) {
      const char = Object.values(CHARACTERS).find((c) => c.name === d.title);
      speak(d.text, char?.voicePitch || 1, char?.voiceRate || 1);
    }
  }, []);

  const handleReward = useCallback((money: number, respect: number) => {
    setStats((s) => ({
      ...s,
      money: s.money + money,
      respect: s.respect + respect,
    }));
  }, []);

  // Add this helper function inside the component (before useEffect):
  const showNotification = useCallback(
    (
      type: "location" | "business" | "zone" | "money" | "mission",
      title: string,
      subtitle?: string,
      duration: number = 6000,
    ) => {
      const id = `notif_${Date.now()}`;

      setNotifications((prev) => [
        ...prev,
        { id, type, title, subtitle, opacity: 1 },
      ]);

      // Fade out and remove
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, opacity: 0 } : n)),
        );
      }, duration - 500);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    },
    [],
  );

  // === MOBILE HANDLERS - OUTSIDE useEffect, use refs ===
  const handleMobileMove = useCallback((x: number, y: number) => {
    keysRef.current["w"] = y > 0.3;
    keysRef.current["s"] = y < -0.3;
    keysRef.current["a"] = x < -0.3;
    keysRef.current["d"] = x > 0.3;
  }, []);

  const handleMobileAction = useCallback(
    (action: "interact" | "shoot" | "mission" | "brake") => {
      switch (action) {
        case "interact":
          if (onKeyDownRef.current) {
            onKeyDownRef.current(new KeyboardEvent("keydown", { key: "e" }));
          }
          break;
        case "shoot":
          if (onKeyDownRef.current) {
            onKeyDownRef.current(new KeyboardEvent("keydown", { key: "f" }));
          }
          break;
        case "mission":
          setShowMissions((prev) => !prev);
          break;
        case "brake":
          if (onKeyDownRef.current) {
            onKeyDownRef.current(
              new KeyboardEvent("keydown", { key: " ", code: "Space" }),
            );
          }
          break;
      }
    },
    [],
  );

  // Detect mobile
  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    // === GAME STATE ===
    // Use the ref instead of local variable
    const keys = keysRef.current;
    let playerState: "driving" | "walking" = "driving";
    let speed = 0;
    let steering = 0;
    let health = 100;
    let wantedLevel = 0;
    let missionIndex = 0;
    let cameraMode: "follow" | "cutscene" = "follow";
    let cutsceneTarget = new THREE.Vector3();
    let cutsceneCamPos = new THREE.Vector3();
    let currentDialogLine = 0;
    let laserTimer = 0;
    let thiefFollowing = false;
    let currentDialogueOptions: DialogueOption[] | null = null;

    const handleBuildingInteraction = async (building: Building) => {
      const response = await callLLM(
        "SHOPKEEPER",
        `Player entered ${building.name}. ${building.description}`,
        `You are a shopkeeper at ${building.name}. Greet the customer briefly in character.  One or two sentences max.`,
      );
      handleDialogue({
        title: building.name,
        text: response,
      });
      setTimeout(() => setDialogue(null), 4000);
    };
    // Capture ref values at effect start
    const mountElement = mountRef.current;
    const minimapElement = minimapRef.current;

    if (!mountElement) return;

    // ...  all your existing code ...

    if (!mountRef.current) return;

    // === INITIALIZE SYSTEMS ===
    aiSystemRef.current = new AIAgentSystem(LLM_ENDPOINT);

    policeSystemRef.current = new PoliceSystem(
      (text, title) => handleDialogue({ title, text }),
      speak,
    );

    missionSystemRef.current = new MissionSystem(
      handleDialogue,
      speak,
      handleReward,
    );

    // === THREE.JS SETUP ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 50, 300);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const colliders: THREE.Mesh[] = [];
    const interactables: any[] = [];
    initWorld(scene, colliders, interactables);

    // After creating neuralCityRef:
    neuralCityRef.current = new NeuralCity(scene);

    // === CITY DATABASE ===
    let money = 500;
    cityDbRef.current = new CityDatabase();
    const savedProgress = cityDbRef.current.getProgress();
    money = savedProgress.money;
    // ... restore other progress ...

    // === STREET GRID ===
    trafficRef.current = new TrafficSystem(scene);
    const streetsGroup = trafficRef.current.drawStreets();
    scene.add(streetsGroup);

    // === CITY BLOCKS & PLOTS ===
    cityBlocksRef.current = generateCityBlocks(NUERNBERG_STREETS);
    console.log(`Generated ${cityBlocksRef.current.length} city blocks`);

    // Initialize buildings from plots (not random positions)
    cityBlocksRef.current.forEach((block) => {
      block.plots.forEach((plot) => {
        // Check if we have a saved building for this plot
        const savedBuilding = cityDbRef.current?.getBuildingForPlot(plot.id);

        if (savedBuilding) {
          // Restore from database
          createBuildingAtPlot(plot, savedBuilding);
          plot.occupied = true;
        } else if (Math.random() < 0.6) {
          // Generate new building (60% chance per plot)
          const building = generateBuildingForPlot(plot, block.zone);
          createBuildingAtPlot(plot, building);
          cityDbRef.current?.addBuilding(building as any, plot.id);
          plot.occupied = true;
        }
      });
    });

    gameManagerRef.current = new GameManager();

    (async () => {
      // Load saved game (or create new)
      const userId = "player_1"; // TODO: Get from auth
      const { progress, world } =
        await gameManagerRef.current!.loadGame(userId);

      // Restore player state
      money = progress.money;
      health = progress.health;
      wantedLevel = progress.wantedLevel;

      // Place NPCs based on lessons
      const lessons = getAllLessons();
      lessons.forEach((lesson) => {
        // Create mission marker at lesson location
        const marker = createLessonMarker(lesson);
        scene.add(marker);
        markers.push({
          mesh: marker,
          id: lesson.id,
          name: lesson.titleDe,
          active: !progress.learning[lesson.subject].lessonsCompleted.includes(
            lesson.id,
          ),
          lesson: lesson,
        });
      });

      // Helper to create lesson markers
      function createLessonMarker(lesson: Lesson): THREE.Group {
        const marker = new THREE.Group();

        const colors: Record<string, number> = {
          physics: 0x00aaff,
          math: 0x00ff00,
          finance: 0xffcc00,
          health: 0xff6666,
          spiritual: 0xffffff,
        };

        const halo = new THREE.Mesh(
          new THREE.CylinderGeometry(3, 3, 4, 16, 1, true),
          new THREE.MeshBasicMaterial({
            color: colors[lesson.subject] || 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
          }),
        );
        halo.position.y = 2;
        marker.add(halo);

        marker.position.set(lesson.location.x, 0, lesson.location.z);

        return marker;
      }
    })();

    // Helper function to create building mesh at a plot
    function createBuildingAtPlot(plot: BuildingPlot, buildingData: any) {
      const group = new THREE.Group();

      // Building size based on plot
      const w = plot.size.w - 2;
      const d = plot.size.d - 2;
      const h = 10 + Math.random() * 10;

      // Main building
      const bodyGeo = new THREE.BoxGeometry(w, h, d);
      const bodyMat = new THREE.MeshLambertMaterial({
        color: buildingData.color || 0x888888,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = h / 2;
      body.castShadow = true;
      group.add(body);

      // Sign
      if (buildingData.signs && buildingData.signs[0]) {
        const signText = buildingData.signs[0].text || buildingData.name;
        const signGeo = new THREE.PlaneGeometry(w - 1, 2);
        const signTex = createTextTexture(signText, "#ffffff", "#222222", 32);
        const signMat = new THREE.MeshBasicMaterial({
          map: signTex,
          transparent: true,
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, h - 2, d / 2 + 0.1);
        group.add(sign);
      }

      // Position and rotate to face street
      group.position.set(plot.position.x, 0, plot.position.z);
      group.rotation.y = plot.rotation;

      scene.add(group);

      // Collider
      const collider = new THREE.Mesh(new THREE.BoxGeometry(w, h, d));
      collider.position.set(plot.position.x, h / 2, plot.position.z);
      collider.visible = false;
      collider.userData = { width: w, depth: d, buildingId: buildingData.id };
      colliders.push(collider);
    }

    function drawRoads() {
      const roadsGroup = new THREE.Group();

      ROADS.forEach((road) => {
        const color =
          road.type === "autobahn"
            ? 0x333333
            : road.type === "hauptstrasse"
            ? 0x444444
            : 0x555555;

        // Draw road segments
        for (let i = 0; i < road.points.length - 1; i++) {
          const start = road.points[i];
          const end = road.points[i + 1];

          const dx = end.x - start.x;
          const dz = end.z - start.z;
          const length = Math.sqrt(dx * dx + dz * dz);
          const angle = Math.atan2(dx, dz);

          // Asphalt
          const roadMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(road.width, length),
            new THREE.MeshLambertMaterial({ color }),
          );
          roadMesh.rotation.x = -Math.PI / 2;
          roadMesh.rotation.z = angle;
          roadMesh.position.set(
            (start.x + end.x) / 2,
            0.05,
            (start.z + end.z) / 2,
          );
          roadMesh.receiveShadow = true;
          roadsGroup.add(roadMesh);

          // Lane markings for autobahn
          if (road.type === "autobahn") {
            // Center lines
            for (let lane = 1; lane < road.lanes; lane++) {
              const offset =
                (lane - road.lanes / 2) * (road.width / road.lanes);
              const lineMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, length),
                new THREE.MeshBasicMaterial({ color: 0xffffff }),
              );
              lineMesh.rotation.x = -Math.PI / 2;
              lineMesh.rotation.z = angle;

              // Offset perpendicular to road direction
              const perpX = Math.cos(angle) * offset;
              const perpZ = -Math.sin(angle) * offset;

              lineMesh.position.set(
                (start.x + end.x) / 2 + perpX,
                0.06,
                (start.z + end.z) / 2 + perpZ,
              );
              roadsGroup.add(lineMesh);
            }

            // Edge lines (yellow for autobahn)
            [-1, 1].forEach((side) => {
              const edgeMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.4, length),
                new THREE.MeshBasicMaterial({ color: 0xffcc00 }),
              );
              edgeMesh.rotation.x = -Math.PI / 2;
              edgeMesh.rotation.z = angle;

              const offset = side * (road.width / 2 - 0.5);
              const perpX = Math.cos(angle) * offset;
              const perpZ = -Math.sin(angle) * offset;

              edgeMesh.position.set(
                (start.x + end.x) / 2 + perpX,
                0.06,
                (start.z + end.z) / 2 + perpZ,
              );
              roadsGroup.add(edgeMesh);
            });
          }
        }

        // Autobahn signs
        if (road.type === "autobahn" && road.points.length > 0) {
          const signPos = road.points[0];
          const sign = createAutobahnSign(road.name, road.speedLimit);
          sign.position.set(signPos.x + 15, 0, signPos.z);
          roadsGroup.add(sign);
        }
      });

      scene.add(roadsGroup);
    }

    function createAutobahnSign(name: string, speed: number): THREE.Group {
      const group = new THREE.Group();

      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 8),
        new THREE.MeshLambertMaterial({ color: 0x888888 }),
      );
      pole.position.y = 4;
      group.add(pole);

      // Sign background (blue for autobahn)
      const signBg = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x0055aa }),
      );
      signBg.position.y = 7;
      group.add(signBg);

      // Speed sign (round, no limit)
      if (speed >= 200) {
        // No speed limit sign
        const noLimit = new THREE.Mesh(
          new THREE.CircleGeometry(1, 32),
          new THREE.MeshBasicMaterial({ color: 0xffffff }),
        );
        noLimit.position.set(0, 7, 0.15);
        group.add(noLimit);

        // Diagonal lines
        const lines = new THREE.Mesh(
          new THREE.PlaneGeometry(0.1, 2),
          new THREE.MeshBasicMaterial({ color: 0x000000 }),
        );
        lines.rotation.z = Math.PI / 4;
        lines.position.set(0, 7, 0.2);
        group.add(lines);
      }

      return group;
    }
    // Call it after scene setup:
    drawRoads();

    // Generate building data for a plot
    function generateBuildingForPlot(
      plot: BuildingPlot,
      zoneName: string,
    ): Building {
      // Generate building data based on zone without calling private methods
      const zonePresets: Record<
        string,
        {
          type: Building["type"];
          color: number;
          name: string;
          description: string;
          signText: string;
        }
      > = {
        Innenstadt: {
          type: "business",
          color: 0x777777,
          name: "City Boutique",
          description: "Feine Mode im Herzen der Stadt.",
          signText: "SALE",
        },
        Südstadt: {
          type: "house",
          color: 0x996633,
          name: "Wohnhaus",
          description: "Gemütliches Mehrfamilienhaus.",
          signText: "ZU VERMIETEN",
        },
        Gostenhof: {
          type: "business",
          color: 0x335577,
          name: "Kultur Café",
          description: "Treffpunkt für Künstler und Studenten.",
          signText: "KAFFEE",
        },
        "Industriegebiet Hafen": {
          type: "business",
          color: 0x555555,
          name: "Lagerhalle",
          description: "Große Halle für Warenumschlag.",
          signText: "LOGISTIK",
        },
        "Wöhrder See": {
          type: "landmark",
          color: 0x228b22,
          name: "Seeblick",
          description: "Grüne Anlage mit Blick auf den See.",
          signText: "RUHEZONE",
        },
        Erlenstegen: {
          type: "house",
          color: 0xc0a080,
          name: "Villa",
          description: "Exklusive Wohnlage.",
          signText: "PRIVAT",
        },
        // Generic/GTA-style areas
        Downtown: {
          type: "business",
          color: 0x666666,
          name: "Office Block",
          description: "Corporate offices and shops.",
          signText: "LEASE",
        },
        Vinewood: {
          type: "business",
          color: 0xaa8844,
          name: "Studio Loft",
          description: "Home of dreams and schemes.",
          signText: "OPEN",
        },
        "Industrial District": {
          type: "business",
          color: 0x444444,
          name: "Factory",
          description: "Hard work, harder people.",
          signText: "WARES",
        },
        "Santa Maria Beach": {
          type: "entertainment",
          color: 0x3399ff,
          name: "Beach Shop",
          description: "Sun, sand, and secrets.",
          signText: "SURF",
        },
        "El Corona": {
          type: "house",
          color: 0x996666,
          name: "Barrio Casa",
          description: "Family first.",
          signText: "CASA",
        },
        "Grove Street": {
          type: "house",
          color: 0x008800,
          name: "Grove Home",
          description: "Home. At least it was before...",
          signText: "HOME",
        },
      };

      const preset = zonePresets[zoneName] || {
        type: "business",
        color: 0x888888,
        name: "Geschäft",
        description: "Ein lokales Geschäft",
        signText: "OFFEN",
      };

      return {
        id: `bld_${plot.id}`,
        type: preset.type,
        name: preset.name,
        description: preset.description,
        signs: [
          {
            text: preset.signText,
            position: "front",
            color: "#fff",
            bgColor: "#333",
          },
        ],
        position: plot.position,
        size: { w: plot.size.w, h: 12, d: plot.size.d },
        color: preset.color,
        generated: false,
      };
    }

    // In useEffect, after scene setup:
    interiorRef.current = new InteriorSystem(
      scene,
      process.env.UPSTASH_REDIS_REST_URL || "",
      process.env.UPSTASH_REDIS_REST_TOKEN || "",
    );

    // In useEffect after scene setup:
    neuralCityRef.current = new NeuralCity(scene);

    // === PROCEDURAL CITY ===
    cityRef.current = new ProceduralCity(scene, colliders, interactables);

    // ✅ FIXED - check before calling:
    const suedstadt = cityRef.current
      .getZones()
      .find((z) => z.name === "Südstadt");
    if (suedstadt) {
      cityRef.current.generateZoneBuildings(suedstadt, 4);
    }

    const innenstadt = cityRef.current
      .getZones()
      .find((z) => z.name === "Innenstadt");
    if (innenstadt) {
      cityRef.current.generateZoneBuildings(innenstadt, 5);
    }

    const gostenhof = cityRef.current
      .getZones()
      .find((z) => z.name === "Gostenhof");
    if (gostenhof) {
      cityRef.current.generateZoneBuildings(gostenhof, 3);
    }

    // === PLAYER CAR ===
    const carGroup = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 8),
      new THREE.MeshLambertMaterial({ color: 0x3366ff }),
    );
    carBody.position.y = 1.5;
    carBody.castShadow = true;
    carGroup.add(carBody);

    const carTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.5, 4),
      new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
    );
    carTop.position.set(0, 2.75, -0.5);
    carTop.castShadow = true;
    carGroup.add(carTop);

    let activeCar = carGroup;

    [
      [-2, 0.8, 2.5],
      [2, 0.8, 2.5],
      [-2, 0.8, -2.5],
      [2, 0.8, -2.5],
    ].forEach((pos) => {
      const w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16),
        new THREE.MeshLambertMaterial({ color: 0x111111 }),
      );
      w.rotation.z = Math.PI / 2;
      w.position.set(pos[0], pos[1], pos[2]);
      carGroup.add(w);
    });
    // carGroup.position.set(0, 0, 120);
    carGroup.position.set(PLAYER_SPAWN.position.x, 0, PLAYER_SPAWN.position.z);
    carGroup.rotation.y = PLAYER_SPAWN.rotation;

    carGroup.rotation.y = Math.PI;
    scene.add(carGroup);

    // === PLAYER ON FOOT ===
    const playerGroup = new THREE.Group();
    // Also set player spawn:
    playerGroup.position.set(0, 0, 125);

    playerGroup.position.set(
      PLAYER_SPAWN.position.x,
      0,
      PLAYER_SPAWN.position.z + 5,
    );

    camera.position.set(
      PLAYER_SPAWN.position.x,
      20,
      PLAYER_SPAWN.position.z + 30,
    );
    camera.lookAt(PLAYER_SPAWN.position.x, 0, PLAYER_SPAWN.position.z);

    const pBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 3.5, 0.8),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
    );
    pBody.position.y = 1.75;
    playerGroup.add(pBody);

    const pHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x8d5524 }),
    );
    pHead.position.y = 4;
    playerGroup.add(pHead);
    playerGroup.visible = false;
    scene.add(playerGroup);

    // === GUN LASER ===
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -50),
    ]);
    const laser = new THREE.Line(
      laserGeo,
      new THREE.LineBasicMaterial({ color: 0xff0000 }),
    );
    laser.visible = false;
    scene.add(laser);

    // === STORY NPCs ===
    interface StoryNPC {
      mesh: THREE.Group;
      id: string;
      character: (typeof CHARACTERS)[keyof typeof CHARACTERS];
      state: string;
      followingPlayer: boolean;
    }
    const storyNPCs: StoryNPC[] = [];

    // Father Martinez at church
    const pastorGroup = new THREE.Group();
    const pastorBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 4, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
    );
    pastorBody.position.y = 2;
    pastorGroup.add(pastorBody);
    const pastorHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xffdbac }),
    );
    pastorHead.position.y = 4.5;
    pastorGroup.add(pastorHead);
    // White collar
    const collar = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
    );
    collar.position.y = 3.8;
    pastorGroup.add(collar);
    pastorGroup.position.set(-120, 0, 25); // Inside church near altar
    scene.add(pastorGroup);

    storyNPCs.push({
      mesh: pastorGroup,
      id: "FATHER_MARTINEZ",
      character: CHARACTERS.FATHER_MARTINEZ,
      state: "idle",
      followingPlayer: false,
    });

    // Maria at salon (downtown)
    const mariaGroup = new THREE.Group();
    const mariaBody = new THREE.Mesh(
      new THREE.BoxGeometry(1, 3.2, 0.7),
      new THREE.MeshLambertMaterial({ color: 0xff1493 }),
    );
    mariaBody.position.y = 1.6;
    mariaGroup.add(mariaBody);
    const mariaHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xdeb887 }),
    );
    mariaHead.position.y = 3.6;
    mariaGroup.add(mariaHead);
    // Hair
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
    );
    hair.position.set(0, 3.7, -0.1);
    hair.scale.set(1, 1.2, 1);
    mariaGroup.add(hair);
    mariaGroup.position.set(0, 0, -100);
    scene.add(mariaGroup);

    storyNPCs.push({
      mesh: mariaGroup,
      id: "MARIA",
      character: CHARACTERS.MARIA,
      state: "idle",
      followingPlayer: false,
    });

    // The Thief (Slick) near docks
    const thiefGroup = new THREE.Group();
    const thiefBody = new THREE.Mesh(
      new THREE.BoxGeometry(1, 3, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x000000 }),
    );
    thiefBody.position.y = 1.5;
    thiefGroup.add(thiefBody);
    const thiefHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x8d7b68 }),
    );
    thiefHead.position.y = 3.5;
    thiefGroup.add(thiefHead);
    // Beanie
    const beanie = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x333333 }),
    );
    beanie.position.y = 3.8;
    thiefGroup.add(beanie);
    thiefGroup.position.set(150, 0, 150); // Docks area
    scene.add(thiefGroup);

    storyNPCs.push({
      mesh: thiefGroup,
      id: "THE_THIEF",
      character: CHARACTERS.THE_THIEF,
      state: "idle",
      followingPlayer: false,
    });

    // OG Loc at Grove Street
    const ogLocGroup = new THREE.Group();
    const ogLocBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 3, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x00aa00 }),
    );
    ogLocBody.position.y = 1.5;
    ogLocGroup.add(ogLocBody);
    const ogLocHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x8d5524 }),
    );
    ogLocHead.position.y = 3.5;
    ogLocGroup.add(ogLocHead);
    // Bandana
    const bandana = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.2, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    );
    bandana.position.y = 3.8;
    ogLocGroup.add(bandana);
    ogLocGroup.position.set(0, 0, 10);
    scene.add(ogLocGroup);

    storyNPCs.push({
      mesh: ogLocGroup,
      id: "OG_LOC",
      character: CHARACTERS.OG_LOC,
      state: "idle",
      followingPlayer: false,
    });

    // Professor Weber - near Innenstadt (university area)
    const professorGroup = new THREE.Group();
    const profBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 3.5, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x3d2314 }), // Brown jacket
    );
    profBody.position.y = 1.75;
    professorGroup.add(profBody);
    const profHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xffdbac }),
    );
    profHead.position.y = 3.8;
    professorGroup.add(profHead);
    // Glasses
    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.15, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x111111 }),
    );
    glasses.position.set(0, 3.9, 0.5);
    professorGroup.add(glasses);
    professorGroup.position.set(50, 0, -80); // Near Innenstadt
    scene.add(professorGroup);

    storyNPCs.push({
      mesh: professorGroup,
      id: "PROFESSOR_WEBER",
      character: CHARACTERS.PROFESSOR_WEBER || EDUCATIONAL_NPCS.PROFESSOR_WEBER,
      state: "idle",
      followingPlayer: false,
    });

    // Sponsor Klaus - near church
    const klausGroup = new THREE.Group();
    const klausBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 3.5, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a }), // Grey sweater
    );
    klausBody.position.y = 1.75;
    klausGroup.add(klausBody);
    const klausHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xdeb887 }),
    );
    klausHead.position.y = 3.8;
    klausGroup.add(klausHead);
    klausGroup.position.set(-100, 0, 60); // Near church, outside
    scene.add(klausGroup);

    storyNPCs.push({
      mesh: klausGroup,
      id: "SPONSOR_KLAUS",
      character: CHARACTERS.SPONSOR_KLAUS || EDUCATIONAL_NPCS.SPONSOR_KLAUS,
      state: "idle",
      followingPlayer: false,
    });

    // Dr. Müller - near Innenstadt medical area
    const doctorGroup = new THREE.Group();
    const docBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 3.5, 0.8),
      new THREE.MeshLambertMaterial({ color: 0xffffff }), // White coat
    );
    docBody.position.y = 1.75;
    doctorGroup.add(docBody);
    const docHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xffdbac }),
    );
    docHead.position.y = 3.8;
    doctorGroup.add(docHead);
    // Hair
    const docHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x4a3728 }),
    );
    docHair.position.set(0, 3.9, -0.1);
    docHair.scale.set(1, 0.8, 1);
    doctorGroup.add(docHair);
    doctorGroup.position.set(30, 0, -130); // Innenstadt
    scene.add(doctorGroup);

    storyNPCs.push({
      mesh: doctorGroup,
      id: "DOCTOR_MUELLER",
      character: CHARACTERS.DOCTOR_MUELLER || EDUCATIONAL_NPCS.DOCTOR_MUELLER,
      state: "idle",
      followingPlayer: false,
    });

    // === GENERIC PEDESTRIANS ===
    interface Pedestrian {
      mesh: THREE.Group;
      speed: number;
      changeTimer: number;
      dead: boolean;
      personality: (typeof CHARACTERS)[keyof typeof CHARACTERS] | null;
    }
    const pedestrians: Pedestrian[] = [];
    const pedPersonalities = [
      CHARACTERS.HOMELESS_PETE,
      CHARACTERS.SHOP_OWNER_LEE,
      null,
      null,
      null,
    ];

    for (let i = 0; i < 30; i++) {
      const ped = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 3, 0.8),
        new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }),
      );
      body.position.y = 1.5;
      ped.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xffdbac }),
      );
      head.position.y = 3.5;
      ped.add(head);

      const angle = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 120;
      ped.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      scene.add(ped);

      pedestrians.push({
        mesh: ped,
        speed: 0.03,
        changeTimer: 0,
        dead: false,
        personality:
          pedPersonalities[Math.floor(Math.random() * pedPersonalities.length)],
      });
    }

    // === POLICE SYSTEM ===
    interface PoliceCar {
      mesh: THREE.Group;
      speed: number;
      sirens: THREE.Mesh[];
      hijacked: boolean;
      state: "patrol" | "warning" | "pursuit" | "arrest";
      warningsIssued: number;
      lastWarningTime: number;
    }
    const policeCars: PoliceCar[] = [];

    function createPoliceCar(): PoliceCar {
      const pc = new THREE.Group();
      const pcBody = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 8),
        new THREE.MeshLambertMaterial({ color: 0x111111 }),
      );
      pcBody.position.y = 1.5;
      pc.add(pcBody);

      const pcDoor = new THREE.Mesh(
        new THREE.BoxGeometry(4.1, 1.5, 4),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
      );
      pcDoor.position.y = 1.5;
      pc.add(pcDoor);

      // "POLICE" text area
      const pcText = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.5, 2),
        new THREE.MeshLambertMaterial({ color: 0x0000aa }),
      );
      pcText.position.set(0, 2.3, 0);
      pc.add(pcText);

      const pcTop = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 4),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
      );
      pcTop.position.set(0, 2.75, -0.5);
      pc.add(pcTop);

      const sirenR = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      sirenR.position.set(0.8, 3.6, -0.5);
      pc.add(sirenR);

      const sirenB = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 0.4),
        new THREE.MeshBasicMaterial({ color: 0x0000ff }),
      );
      sirenB.position.set(-0.8, 3.6, -0.5);
      pc.add(sirenB);

      const angle = Math.random() * Math.PI * 2;
      const dist = 150;
      const pPos =
        playerState === "driving" ? activeCar.position : playerGroup.position;
      pc.position.set(
        pPos.x + Math.cos(angle) * dist,
        0,
        pPos.z + Math.sin(angle) * dist,
      );
      scene.add(pc);

      return {
        mesh: pc,
        speed: 0,
        sirens: [sirenR, sirenB],
        hijacked: false,
        state: "patrol",
        warningsIssued: 0,
        lastWarningTime: 0,
      };
    }

    // === MISSION MARKERS ===
    interface MissionMarker {
      mesh: THREE.Group;
      id: string;
      name: string;
      active: boolean;
      npcId?: string;
      lesson?: Lesson;
    }
    const markers: MissionMarker[] = [];

    // Mission 1: OG Loc intro
    const m1 = new THREE.Group();
    const m1Halo = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 4, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    m1Halo.position.y = 2;
    m1.add(m1Halo);
    m1.position.set(0, 0, 10);
    scene.add(m1);
    markers.push({
      mesh: m1,
      id: "meet_og_loc",
      name: "Homies & Hallucinations",
      active: true,
      npcId: "OG_LOC",
    });

    // Mission 2: Meet Maria
    const m2 = new THREE.Group();
    const m2Halo = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 4, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xff69b4,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    m2Halo.position.y = 2;
    m2.add(m2Halo);
    m2.position.set(0, 0, -100);
    scene.add(m2);
    markers.push({
      mesh: m2,
      id: "meet_maria",
      name: "Burning Heart",
      active: true,
      npcId: "MARIA",
    });

    // Mission 3: The Confession (at church)
    const m3 = new THREE.Group();
    const m3Halo = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 4, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    m3Halo.position.y = 2;
    m3.add(m3Halo);
    m3.position.set(-120, 0, 50);
    scene.add(m3);
    markers.push({
      mesh: m3,
      id: "the_confession",
      name: "The Confession",
      active: true,
      npcId: "FATHER_MARTINEZ",
    });

    // === INPUT HANDLING ===
    const onKeyDown = async (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;

      // Handle dialogue options (1, 2, 3 keys)
      if (currentDialogueOptions && ["1", "2", "3"].includes(e.key)) {
        const optionIndex = parseInt(e.key) - 1;
        if (currentDialogueOptions[optionIndex]) {
          currentDialogueOptions[optionIndex].action();
          currentDialogueOptions = null;
          return;
        }
      }

      // Surrender to police
      // === SPACE KEY - BRAKE / SURRENDER ===
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        // If dialogue is showing, dismiss it
        if (dialogue) {
          setDialogue(null);
          return; // Don't do anything else!
        }

        if (showSurrenderPrompt && wantedLevel > 0) {
          wantedLevel = 0;
          setStats((s) => ({ ...s, wanted: 0 }));

          const fine = Math.min(money, 500 * wantedLevel);
          money -= fine;
          setStats((s) => ({ ...s, money }));

          if (playerState === "driving") {
            playerState = "walking";
            playerGroup.visible = true;
            setOnFoot(true);
          }
          playerGroup.position.set(0, 0, -100);

          handleDialogue({
            title: "Verhaftet",
            text: `Du hast ${fine}€ Strafe gezahlt.  Du bist jetzt frei. `,
          });
          setShowSurrenderPrompt(false);
          setTimeout(() => setDialogue(null), 3000);

          return;
        }

        if (playerState === "driving") {
          speed *= 0.8;
        }
      }

      // === M KEY - MISSION OVERVIEW ===
      if (e.key.toLowerCase() === "m") {
        setShowMissions((prev) => !prev);
      }

      // N = toggle Matrix mode
      if (e.key.toLowerCase() === "n") {
        const active = neuralCityRef.current?.toggleMatrixMode();
        showNotification(
          "zone",
          active ? "🔴 MATRIX MODE" : "🔵 NORMAL MODE",
          active
            ? `${neuralCityRef.current?.getBuildingCount()} neural buildings`
            : undefined,
          2000,
        );
      }

      // // T = time warp (see the past!)
      // if (e.key.toLowerCase() === 't' && neuralCityRef.current?. isMatrixModeActive()) {
      //   const warp = neuralCityRef.current. cycleTimeWarp();
      //   const percent = Math.round(warp * 100);
      //   showNotification('zone',
      //     `⏰ TIME: ${percent}%`,
      //     warp < 1 ? 'Viewing the past.. .' : 'Present',
      //     1500
      //   );
      // }

      // Interact (E key)
      if (e.key.toLowerCase() === "e" && cameraMode === "follow") {
        // Check if already inside - press E to exit
        if (interiorRef.current?.isInside()) {
          interiorRef.current.exitBuilding(playerGroup, camera);
          playerState = "walking";
          return;
        }

        if (playerState === "driving") {
          // Exit vehicle
          playerState = "walking";
          playerGroup.position
            .copy(activeCar.position)
            .add(new THREE.Vector3(-5, 0, 0));
          playerGroup.rotation.y = activeCar.rotation.y;
          playerGroup.visible = true;
          setOnFoot(true);
        } else {
          // Try to enter vehicles
          if (playerGroup.position.distanceTo(carGroup.position) < 6) {
            activeCar = carGroup;
            playerState = "driving";
            playerGroup.visible = false;
            setOnFoot(false);
            return;
          }

          // Hijack police car
          for (const pc of policeCars) {
            if (
              !pc.hijacked &&
              playerGroup.position.distanceTo(pc.mesh.position) < 6
            ) {
              activeCar = pc.mesh;
              pc.hijacked = true;
              playerState = "driving";
              playerGroup.visible = false;
              setOnFoot(false);
              wantedLevel = Math.min(wantedLevel + 2, 5);
              return;
            }
          }

          // Interact with story NPCs
          for (const npc of storyNPCs) {
            if (playerGroup.position.distanceTo(npc.mesh.position) < 6) {
              await interactWithStoryNPC(npc);
              return;
            }
          }

          // Interact with pedestrians (with LLM if they have personality)
          for (const ped of pedestrians) {
            if (
              !ped.dead &&
              playerGroup.position.distanceTo(ped.mesh.position) < 5
            ) {
              if (ped.personality) {
                // LLM-powered response
                const response = await callLLM(
                  ped.personality.name,
                  `A stranger approached me on the street.  Wanted level: ${wantedLevel}`,
                  ped.personality.systemPrompt,
                );
                handleDialogue({ title: ped.personality.name, text: response });
              } else {
                // Generic response

                // Update pedestrian generic lines:
                const lines = [
                  "Hey, pass auf!",
                  "Schönes Wetter, oder?",
                  "Hast du dich verlaufen?",
                  "Ich hab zu tun.",
                ];
                handleDialogue({
                  title: "Fremder",
                  text: lines[Math.floor(Math.random() * lines.length)],
                });
              }
              setTimeout(() => setDialogue(null), 3000);
              return;
            }
          }

          // Interact with police
          for (const pc of policeCars) {
            if (
              !pc.hijacked &&
              playerGroup.position.distanceTo(pc.mesh.position) < 8
            ) {
              if (wantedLevel > 0) {
                setShowSurrenderPrompt(true);
                handleDialogue({
                  title: "Officer Johnson",
                  text: "You want to surrender? Press [SPACE] or keep your hands where I can see them.",
                });
              } else {
                const response = await callLLM(
                  "OFFICER_JOHNSON",
                  "A citizen approached me during patrol. No active warrants.",
                  CHARACTERS.OFFICER_JOHNSON.systemPrompt,
                );
                handleDialogue({ title: "Officer Johnson", text: response });
              }
              setTimeout(() => {
                setDialogue(null);
                setShowSurrenderPrompt(false);
              }, 4000);
              return;
            }
          }

          // Church altar interaction
          // Search for "altar" in your onKeyDown handler
          // It should be in the walking interactions section (when playerState !== 'driving')

          // Church altar interaction
          const altar = interactables.find((i) => i.type === "altar");
          if (altar && playerGroup.position.distanceTo(altar.pos) < 6) {
            // Thief mission completion
            setShowPrayerModal(true);
            if (thiefFollowing) {
              missionSystemRef.current?.thiefReachedChurch();
              thiefFollowing = false;
              const thiefNPC = storyNPCs.find((n) => n.id === "THE_THIEF");
              if (thiefNPC) {
                thiefNPC.followingPlayer = false;
                thiefNPC.mesh.position.set(-120, 0, 20);
              }
            }
            // WANTED LEVEL RESET - this is the key part!
            else if (wantedLevel > 0) {
              wantedLevel = 0; // ← Make sure this line exists!
              setStats((s) => ({ ...s, wanted: 0 })); // ← And this one!
              handleDialogue({
                title: "Kirchenasyl",
                text: "Deine Sünden sind vergeben. Die Polizei verfolgt dich hier nicht.",
              });
              speak("Deine Sünden sind vergeben", 0.8, 0.9);
              setTimeout(() => setDialogue(null), 3000);
            } else {
              // Normal prayer when no wanted level
              const prayers = [
                "Du fühlst inneren Frieden.",
                "Die Last deiner Entscheidungen wird leichter.",
                "Eine Stimme flüstert: 'Es gibt immer einen Weg zurück. '",
              ];
              handleDialogue({
                title: "Altar",
                text: prayers[Math.floor(Math.random() * prayers.length)],
              });
              setTimeout(() => setDialogue(null), 3000);
            }
            return; // ← Important!  Exit after handling
          }

          // TV interaction
          const tv = interactables.find((i) => i.type === "tv");
          if (tv && playerGroup.position.distanceTo(tv.pos) < 5) {
            const channels = [
              "Breaking News: Gang violence continues in Los Santos.. .",
              "Weather: Sunny, 85°F.  Perfect day for a drive.",
              "Ad: Visit Cluckin' Bell!  Ba-gawk!",
              "Documentary: The rise and fall of Grove Street...",
            ];
            handleDialogue({
              title: "TV",
              text: channels[Math.floor(Math.random() * channels.length)],
            });
            setTimeout(() => setDialogue(null), 3000);
            return;
          }
        }
        // At the end of walking interactions, add:
        if (cityRef.current) {
          const nearbyBuilding = cityRef.current.getBuildingAt(
            playerGroup.position.x,
            playerGroup.position.z,
            6,
          );
          if (nearbyBuilding && interiorRef.current) {
            // Enter the building in FPV mode
            const entered = await interiorRef.current.enterBuilding(
              nearbyBuilding.id,
              nearbyBuilding.type || "shop",
              playerGroup,
              camera,
            );
            if (entered) {
              showNotification(
                "location",
                nearbyBuilding.name,
                "Drücke E zum Verlassen",
                4000,
              );
              return;
            }
          }
        }
      }

      // Shoot (F key)
      if (e.key.toLowerCase() === "f") {
        laser.visible = true;
        laserTimer = 8;

        const sourceObj = playerState === "driving" ? activeCar : playerGroup;
        const start = sourceObj.position
          .clone()
          .add(new THREE.Vector3(0, 2, 0));
        const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(
          sourceObj.quaternion,
        );
        const end = start.clone().add(dir.multiplyScalar(50));

        const positions = new Float32Array([
          start.x,
          start.y,
          start.z,
          end.x,
          end.y,
          end.z,
        ]);
        laser.geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );

        pedestrians.forEach((p) => {
          if (!p.dead) {
            const toPed = p.mesh.position.clone().sub(start);
            if (toPed.length() < 50 && toPed.normalize().dot(dir) > 0.9) {
              p.dead = true;
              p.mesh.rotation.x = -Math.PI / 2;
              p.mesh.position.y = 0.5;
              wantedLevel = Math.min(wantedLevel + 1, 5);
            }
          }
        });
      }
    };

    async function interactWithStoryNPC(npc: StoryNPC) {
      const ms = missionSystemRef.current;
      if (!ms) return;

      switch (npc.id) {
        case "FATHER_MARTINEZ":
          if (!ms.isMissionComplete("the_confession")) {
            ms.startThiefMission();
            cameraMode = "cutscene";
            cutsceneCamPos.set(-100, 5, 70);
            cutsceneTarget.set(-120, 5, 50);
            setStats((s) => ({ ...s, isCutscene: true }));
          } else {
            const response = await callLLM(
              "FATHER_MARTINEZ",
              "The player returns after completing the confession mission.",
              npc.character.systemPrompt,
            );
            handleDialogue({ title: npc.character.name, text: response });
            setTimeout(() => setDialogue(null), 4000);
          }
          break;

        case "MARIA":
          const mariaDialogue = ms.interactWithMaria();
          if (mariaDialogue) {
            handleDialogue(mariaDialogue);
            if (mariaDialogue.options) {
              currentDialogueOptions = mariaDialogue.options;
            } else {
              setTimeout(() => setDialogue(null), 4000);
            }
          }
          break;

        case "THE_THIEF":
          const thiefState = ms.getThiefState();
          if (
            thiefState.phase === "find_thief" ||
            thiefState.phase === "convince"
          ) {
            const thiefDialogue = ms.interactWithThief();
            if (thiefDialogue) {
              handleDialogue(thiefDialogue);
              if (thiefDialogue.options) {
                currentDialogueOptions = thiefDialogue.options;
              }
            }
          } else if (thiefState.phase === "escort" && !npc.followingPlayer) {
            npc.followingPlayer = true;
            thiefFollowing = true;
            handleDialogue({
              title: npc.character.name,
              text: "Alright, let's go. But make it quick.",
            });
            setTimeout(() => setDialogue(null), 2000);
          }
          break;

        case "OG_LOC":
          const response = await callLLM(
            "OG_LOC",
            `First meeting with player.  Player has $${money} and ${wantedLevel} stars.`,
            npc.character.systemPrompt,
          );
          handleDialogue({ title: npc.character.name, text: response });

          // Mark mission marker as done
          const marker = markers.find((m) => m.npcId === "OG_LOC");
          if (marker?.active) {
            marker.active = false;
            scene.remove(marker.mesh);
            missionIndex++;
          }
          setTimeout(() => setDialogue(null), 5000);
          break;
      }
    }
    // Store reference so mobile controls can access it
    onKeyDownRef.current = onKeyDown;

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Add state variable before the game loop:
    let lastZoneName = "";
    let completedMissions: string[] = [];

    // Update the building interaction in the E key handler:
    // (Add this in the playerState === 'walking' interaction section)

    // Check for building interaction

    if (cityRef.current) {
      const nearbyBuilding = cityRef.current.getBuildingAt(
        playerGroup.position.x,
        playerGroup.position.z,
        6,
      );
      if (nearbyBuilding) {
        // Silent notification - no dialogue interruption!
        showNotification(
          "business",
          nearbyBuilding.name,
          nearbyBuilding.description,
        );
        return;
      }
    }

    // === GAME LOOP ===
    let frame = 0;
    let lastFrameTime = performance.now();

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const deltaTime = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      frame++;

      // Audio
      if (wantedLevel > 0 && frame % 60 === 0 && audioCtx && sirenOsc) {
        const now = audioCtx.currentTime;
        sirenOsc.frequency.linearRampToValueAtTime(1200, now + 0.5);
        sirenOsc.frequency.linearRampToValueAtTime(600, now + 1.0);
      }
      toggleSiren(wantedLevel > 0);

      if (playerState === "driving") {
        activeCar.position.y = Math.max(0, activeCar.position.y);
      } else {
        playerGroup.position.y = Math.max(0, playerGroup.position.y);
      }

      // Roof hiding for interiors
      interactables
        .filter((i) => i.type === "roof")
        .forEach((roof) => {
          const pPos =
            playerState === "driving"
              ? activeCar.position
              : playerGroup.position;
          const dx = Math.abs(pPos.x - roof.housePos.x);
          const dz = Math.abs(pPos.z - roof.housePos.z);
          roof.mesh.visible = !(dx < roof.dims.w / 2 && dz < roof.dims.d / 2);
        });

      // === MINIMAP ===
      if (minimapRef.current) {
        const ctx = minimapRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 200, 200);
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(0, 0, 200, 200);

          const pPos =
            playerState === "driving"
              ? activeCar.position
              : playerGroup.position;
          const pRot =
            playerState === "driving"
              ? activeCar.rotation.y
              : playerGroup.rotation.y;

          ctx.save();
          ctx.translate(100, 100);
          ctx.rotate(pRot);

          // Buildings
          ctx.fillStyle = "#555";
          MAP_LAYOUT.forEach((obj) => {
            const dx = obj.x - pPos.x;
            const dz = obj.z - pPos.z;
            ctx.fillRect(
              dx * 0.5 - (obj.w || 20) * 0.25,
              dz * 0.5 - (obj.d || 20) * 0.25,
              (obj.w || 20) * 0.5,
              (obj.d || 20) * 0.5,
            );
          });

          // Mission markers
          markers
            .filter((m) => m.active)
            .forEach((m) => {
              const dx = m.mesh.position.x - pPos.x;
              const dz = m.mesh.position.z - pPos.z;
              ctx.fillStyle = "gold";
              ctx.beginPath();
              ctx.arc(dx * 0.5, dz * 0.5, 4, 0, Math.PI * 2);
              ctx.fill();
            });

          // Story NPCs
          storyNPCs.forEach((npc) => {
            const dx = npc.mesh.position.x - pPos.x;
            const dz = npc.mesh.position.z - pPos.z;
            ctx.fillStyle =
              npc.id === "MARIA"
                ? "#ff69b4"
                : npc.id === "THE_THIEF"
                ? "#333"
                : "#fff";
            ctx.beginPath();
            ctx.arc(dx * 0.5, dz * 0.5, 3, 0, Math.PI * 2);
            ctx.fill();
          });

          // Police
          policeCars.forEach((pc) => {
            if (!pc.hijacked) {
              const dx = pc.mesh.position.x - pPos.x;
              const dz = pc.mesh.position.z - pPos.z;
              ctx.fillStyle = "#0066ff";
              ctx.beginPath();
              ctx.arc(dx * 0.5, dz * 0.5, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          ctx.restore();

          // Player arrow
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.moveTo(100, 95);
          ctx.lineTo(105, 105);
          ctx.lineTo(100, 103);
          ctx.lineTo(95, 105);
          ctx.fill();
        }
      }

      // === GAMEPLAY ===
      if (cameraMode === "follow") {
        if (laserTimer > 0) {
          laserTimer--;
          if (laserTimer <= 0) laser.visible = false;
        }

        // Movement
        if (playerState === "driving") {
          if (keys["w"] || keys["arrowup"]) speed += 0.03;
          if (keys["s"] || keys["arrowdown"]) speed -= 0.03;
          speed *= 0.98;

          if (Math.abs(speed) > 0.1) {
            let turn = 0.0025;
            if (keys["shift"]) turn = 0.004;
            if (keys["a"] || keys["arrowleft"]) steering += turn;
            if (keys["d"] || keys["arrowright"]) steering -= turn;
          }

          steering *= 0.92;
          activeCar.rotation.y += steering * speed * 2.5;

          const velocity = new THREE.Vector3(0, 0, speed).applyQuaternion(
            activeCar.quaternion,
          );
          const nextPos = activeCar.position.clone().add(velocity);

          let collide = false;
          colliders.forEach((b) => {
            if (
              Math.abs(nextPos.x - b.position.x) < b.userData.width / 2 + 3 &&
              Math.abs(nextPos.z - b.position.z) < b.userData.depth / 2 + 3
            ) {
              collide = true;
              speed *= -0.4;
              health -= 1;
            }
          });

          if (!collide) activeCar.position.copy(nextPos);
        } else {
          // Walking
          speed = 0;
          const walkSpeed = 0.4;
          if (keys["w"]) playerGroup.translateZ(walkSpeed);
          if (keys["s"]) playerGroup.translateZ(-walkSpeed);
          if (keys["a"]) playerGroup.rotation.y += 0.05;
          if (keys["d"]) playerGroup.rotation.y -= 0.05;

          colliders.forEach((b) => {
            if (
              Math.abs(playerGroup.position.x - b.position.x) <
                b.userData.width / 2 + 1 &&
              Math.abs(playerGroup.position.z - b.position.z) <
                b.userData.depth / 2 + 1
            ) {
              const dir = playerGroup.position
                .clone()
                .sub(b.position)
                .normalize();
              playerGroup.position.add(dir.multiplyScalar(0.5));
            }
          });
        }

        // Thief following behavior
        if (thiefFollowing) {
          const thiefNPC = storyNPCs.find((n) => n.id === "THE_THIEF");
          if (thiefNPC) {
            if (playerState === "driving") {
              // Thief gets in the car (hidden)
              thiefNPC.mesh.visible = false;
            } else {
              thiefNPC.mesh.visible = true;
              const dist = thiefNPC.mesh.position.distanceTo(
                playerGroup.position,
              );
              if (dist > 4) {
                thiefNPC.mesh.lookAt(playerGroup.position);
                thiefNPC.mesh.translateZ(0.25);
              }
            }
          }
        }

        // Pedestrian AI
        pedestrians.forEach((ped) => {
          if (ped.dead) return;

          ped.changeTimer--;
          if (ped.changeTimer <= 0) {
            ped.mesh.rotation.y = Math.random() * Math.PI * 2;
            ped.changeTimer = 40 + Math.random() * 80;
          }
          ped.mesh.translateZ(ped.speed);

          // Hit by car
          const carPos =
            playerState === "driving"
              ? activeCar.position
              : new THREE.Vector3(9999, 0, 9999);
          if (
            ped.mesh.position.distanceTo(carPos) < 4 &&
            Math.abs(speed) > 0.3
          ) {
            health -= 1;
            wantedLevel = Math.min(wantedLevel + 1, 5);
            ped.dead = true;
            ped.mesh.rotation.x = -Math.PI / 2;
            ped.mesh.position.y = 0.5;
            const flyDir = ped.mesh.position
              .clone()
              .sub(carPos)
              .normalize()
              .multiplyScalar(5);
            ped.mesh.position.add(flyDir);
          }
        });

        // === PROCEDURAL GENERATION ===
        if (frame % 300 === 0 && cityRef.current) {
          // Every 5 seconds
          const pPos =
            playerState === "driving"
              ? activeCar.position
              : playerGroup.position;

          // Update progress
          cityRef.current.updateProgress(
            money,
            stats.respect,
            missionSystemRef.current?.getMariaAffection() || 50,
            new Set(completedMissions),
          );

          // Generate buildings near player
          cityRef.current.generateNearPlayer(pPos.x, pPos.z);

          // Add this helper function:
          const getZoneTagline = (zoneName: string): string => {
            const taglines: Record<string, string> = {
              Südstadt: "Wo Träume geboren werden...  und sterben",
              Innenstadt: "Das Herz von Nürnberg",
              Erlenstegen: "Wo das Geld wohnt",
              "Industriegebiet Hafen": "Hier wird geschuftet",
              "Wöhrder See": "Entspannung pur",
              Gostenhof: "Multikulti mit Charme",
              // English versions
              "Grove Street": "Home.  At least it was before.. .",
              Downtown: "Where deals are made",
              Vinewood: "Dreams and schemes",
              "Industrial District": "Hard work, harder people",
              "Santa Maria Beach": "Sun, sand, and secrets",
              "El Corona": "Family first",
            };
            return taglines[zoneName] || "";
          };

          // Show zone notification
          // Zone notification - subtle, not dialogue
          const currentZone = cityRef.current.getPlayerZone(pPos.x, pPos.z);
          if (currentZone && currentZone.name !== lastZoneName) {
            lastZoneName = currentZone.name;
            showNotification(
              "zone",
              currentZone.name,
              getZoneTagline(currentZone.name),
              4000,
            );
            // NO speak() call - silent!
          }
        }

        // === POLICE AI WITH WARNINGS ===
        const targetPos =
          playerState === "driving" ? activeCar.position : playerGroup.position;

        // Spawn police based on wanted level
        if (
          wantedLevel > 0 &&
          policeCars.length < wantedLevel * 2 &&
          frame % 100 === 0
        ) {
          policeCars.push(createPoliceCar());
        }

        if (frame % 300 === 0 && cityRef.current) {
          const pPos =
            playerState === "driving"
              ? activeCar.position
              : playerGroup.position;

          // Check for nearby building to interact with (non-blocking)
          const nearbyBuilding = cityRef.current.getBuildingAt(
            pPos.x,
            pPos.z,
            6,
          );
          if (nearbyBuilding && !dialogue) {
            // Only if not already showing dialogue
            handleBuildingInteraction(nearbyBuilding); // No await - fire and forget
          }
        }

        policeCars.forEach((pc, idx) => {
          if (pc.hijacked) return;

          // Siren flash
          if (frame % 15 === 0) {
            pc.sirens[0].visible = !pc.sirens[0].visible;
            pc.sirens[1].visible = !pc.sirens[1].visible;
          }

          // IMPROVED collision detection with player car
          if (playerState === "driving") {
            const distToCar = pc.mesh.position.distanceTo(activeCar.position);
            if (distToCar < 5) {
              // Collision radius
              health -= 2;

              // Push both vehicles apart
              const pushDir = activeCar.position
                .clone()
                .sub(pc.mesh.position)
                .normalize();
              activeCar.position.add(pushDir.multiplyScalar(2));
              pc.mesh.position.add(pushDir.multiplyScalar(-1));

              // Slow both down
              speed *= 0.5;
              pc.speed *= 0.3;

              // Increase wanted level on collision
              if (wantedLevel > 0) {
                wantedLevel = Math.min(wantedLevel + 0.5, 5);
              }
            }
          }

          const toPlayer = targetPos.clone().sub(pc.mesh.position);
          const distToPlayer = toPlayer.length();

          if (wantedLevel > 0 && distToPlayer < 250) {
            // Police state machine
            const now = Date.now();

            if (pc.state === "patrol" && wantedLevel > 0) {
              pc.state = "warning";
              pc.warningsIssued = 0;
            }

            if (pc.state === "warning") {
              // Issue warnings before pursuit
              if (now - pc.lastWarningTime > 5000 && pc.warningsIssued < 3) {
                pc.warningsIssued++;
                pc.lastWarningTime = now;

                const warnings = [
                  "This is LSPD!  Pull over NOW!",
                  "Final warning! Stop your vehicle! ",
                  "Suspect is not complying.  All units pursue!",
                ];

                if (distToPlayer < 100) {
                  handleDialogue({
                    title: "Officer",
                    text: warnings[pc.warningsIssued - 1],
                  });
                  speak(warnings[pc.warningsIssued - 1], 0.9, 1.1);
                  setTimeout(() => setDialogue(null), 3000);
                }
              }

              if (pc.warningsIssued >= 3) {
                pc.state = "pursuit";
              }

              // Slower approach during warning phase
              pc.speed = Math.min(pc.speed + 0.01, 0.8);
            }

            if (pc.state === "pursuit") {
              // Full pursuit
              pc.speed = Math.min(pc.speed + 0.02, 1.4);
            }

            // Flanking behavior
            const offset = new THREE.Vector3(
              Math.sin(idx) * 20,
              0,
              Math.cos(idx) * 20,
            );
            const flankTarget = targetPos.clone().add(offset);
            const toFlank = flankTarget.sub(pc.mesh.position);
            const targetRot = Math.atan2(toFlank.x, toFlank.z);

            let rotDiff = targetRot - pc.mesh.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            pc.mesh.rotation.y += rotDiff * 0.05;
          } else if (wantedLevel === 0) {
            pc.state = "patrol";
            pc.speed *= 0.95;
            pc.warningsIssued = 0;
          }

          const dir = new THREE.Vector3(0, 0, pc.speed).applyQuaternion(
            pc.mesh.quaternion,
          );
          const nextPcPos = pc.mesh.position.clone().add(dir);

          // Collision with player
          if (
            playerState === "driving" &&
            nextPcPos.distanceTo(activeCar.position) < 6
          ) {
            health -= 1;
            pc.speed *= -0.5;
            const push = dir.clone().normalize().multiplyScalar(1.5);
            activeCar.position.add(push);
          } else {
            pc.mesh.position.copy(nextPcPos);
          }
        });

        // Mission marker interaction
        const charPos =
          playerState === "driving" ? activeCar.position : playerGroup.position;
        markers.forEach((m) => {
          if (m.active) {
            m.mesh.rotation.y += 0.05;
          }
        });

        // Camera follow
        const focusObj = playerState === "driving" ? activeCar : playerGroup;
        const offset = new THREE.Vector3(0, 10, -22);
        if (speed > 0.8) {
          offset.x += (Math.random() - 0.5) * 0.2;
          offset.y += (Math.random() - 0.5) * 0.2;
        }
        offset.applyQuaternion(focusObj.quaternion);
        const camTarget = focusObj.position.clone().add(offset);
        camera.position.lerp(camTarget, 0.08);
        camera.lookAt(focusObj.position);
      } else {
        // Cutscene camera
        camera.position.lerp(cutsceneCamPos, 0.04);
        camera.lookAt(cutsceneTarget);
      }

      // Update stats
      if (frame % 10 === 0) {
        setStats((s) => ({
          ...s,
          speed: (speed * 100).toFixed(0),
          health,
          wanted: wantedLevel,
          money,
          relationship: missionSystemRef.current?.getMariaAffection() || 50,
        }));
      }

      if (interiorRef.current?.isInside()) {
        interiorRef.current.updateFPVControls(camera, keys);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
        return; // Skip exterior game logic when inside
      }

      if (neuralCityRef.current) {
        neuralCityRef.current.update(deltaTime, playerGroup.position);
      }

      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Then at the END, in the cleanup function, use the captured values:
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      onKeyDownRef.current = null;
      if (mountElement) mountElement.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDialogue, handleReward]);
  // Cleanup:
  neuralCityRef.current?.dispose();

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
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100vh", position: "relative" }}
      />

      {/* HUD */}
      {!stats.isCutscene && (
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

          {/* Relationship indicator */}
          {stats.relationship !== 50 && (
            <div
              style={{ marginTop: "5px", fontSize: "14px", color: "#ff69b4" }}
            >
              ❤️ Maria: {stats.relationship}%
            </div>
          )}

          {/* Controls */}
          <div
            style={{
              marginTop: "10px",
              fontSize: "14px",
              color: "#ccc",
              fontFamily: "monospace",
              background: "rgba(0,0,0,0.5)",
              padding: "5px",
            }}
          >
            [E] {onFoot ? "ENTER CAR / INTERACT" : "EXIT CAR"} | [F] SHOOT |
            [WASD] MOVE
          </div>

          {/* Minimap */}
          <div
            style={{
              marginTop: "20px",
              border: "2px solid white",
              borderRadius: "50%",
              overflow: "hidden",
              width: "200px",
              height: "200px",
            }}
          >
            <canvas ref={minimapRef} width={200} height={200} />
          </div>
        </div>
      )}

      {/* Cutscene Bars */}
      {stats.isCutscene && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "12%",
              background: "black",
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "12%",
              background: "black",
              zIndex: 10,
            }}
          />
        </>
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
          <p
            style={{
              fontSize: "20px",
              lineHeight: "1.5",
              margin: 0,
              textShadow: "1px 1px 2px black",
            }}
          >
            {dialogue.text}
          </p>

          {/* Dialogue Options */}
          {dialogue.options && (
            <div
              style={{
                marginTop: "15px",
                borderTop: "1px solid #333",
                paddingTop: "15px",
              }}
            >
              {dialogue.options.map((opt, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px",
                    margin: "5px 0",
                    background: "rgba(76, 175, 80, 0.2)",
                    border: "1px solid #4caf50",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: "#4caf50", marginRight: "10px" }}>
                    [{i + 1}]
                  </span>
                  {opt.text}
                </div>
              ))}
            </div>
          )}

          {!dialogue.options && (
            <p
              style={{
                textAlign: "right",
                fontSize: "14px",
                opacity: 0.7,
                margin: "15px 0 0 0",
                color: "#aaa",
              }}
            >
              [SPACE] CONTINUE
            </p>
          )}
        </div>
      )}

      {/* Surrender Prompt */}
      {showSurrenderPrompt && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 200, 0.8)",
            padding: "20px",
            color: "white",
            fontFamily: "monospace",
            fontSize: "18px",
            textAlign: "center",
            border: "3px solid white",
            zIndex: 25,
          }}
        >
          🚔 SURRENDER? 🚔
          <br />
          Press [SPACE] to give up peacefully
          <br />
          <span style={{ fontSize: "14px", opacity: 0.7 }}>
            or keep running...{" "}
          </span>
        </div>
      )}
      {showPrayerModal && (
        <PrayerModal
          onClose={() => setShowPrayerModal(false)}
          onPrayerComplete={() => {
            setStats((s) => ({ ...s, wanted: 0 }));
          }}
        />
      )}
      {/* GTA Vice City Style Notifications - Non-intrusive */}
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
              textShadow:
                "2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)",
            }}
          >
            {/* Zone/Location - Big stylized text */}
            {(notif.type === "zone" || notif.type === "location") && (
              <>
                <div
                  style={{
                    fontFamily: '"Pricedown", "Impact", sans-serif',
                    fontSize: "42px",
                    color: "#fff",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    WebkitTextStroke: "1px #000",
                  }}
                >
                  {notif.title}
                </div>
                {notif.subtitle && (
                  <div
                    style={{
                      fontFamily: '"Arial Narrow", Arial, sans-serif',
                      fontSize: "16px",
                      color: "#ffcc00",
                      fontStyle: "italic",
                      marginTop: "-5px",
                    }}
                  >
                    {notif.subtitle}
                  </div>
                )}
              </>
            )}

            {/* Business - Smaller, elegant */}
            {notif.type === "business" && (
              <>
                <div
                  style={{
                    fontFamily: '"Georgia", serif',
                    fontSize: "28px",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {notif.title}
                </div>
                {notif.subtitle && (
                  <div
                    style={{
                      fontFamily: "Arial, sans-serif",
                      fontSize: "14px",
                      color: "#aaa",
                      maxWidth: "300px",
                    }}
                  >
                    {notif.subtitle}
                  </div>
                )}
              </>
            )}

            {/* Money notification */}
            {notif.type === "money" && (
              <div
                style={{
                  fontFamily: '"Impact", sans-serif',
                  fontSize: "32px",
                  color: "#4caf50",
                  letterSpacing: "1px",
                }}
              >
                +${notif.title}
              </div>
            )}

            {/* Mission notification */}
            {notif.type === "mission" && (
              <div
                style={{
                  fontFamily: '"Impact", sans-serif',
                  fontSize: "36px",
                  color: "#ffcc00",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  animation: "pulse 0.5s ease-in-out",
                }}
              >
                {notif.title}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Mobile Controls */}
      {isMobile && (
        <MobileControls
          onMove={handleMobileMove}
          onAction={handleMobileAction}
          showMissionButton={true}
        />
      )}

      {/* Mission Overview (works on both mobile and desktop) */}
      {showMissions && gameManagerRef.current?.getProgress() && (
        <MissionOverview
          progress={gameManagerRef.current.getProgress()!}
          onClose={() => setShowMissions(false)}
        />
      )}

      {/* Update the controls hint for desktop */}
      {!isMobile && (
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
          [WASD] Bewegen | [E] Interaktion | [F] Schießen | [SPACE]
          Bremsen/Aufgeben | [M] Missionen
        </div>
      )}
    </div>
  );
}
function createTextTexture(
  signText: string,
  textColor: string = "#ffffff",
  bgColor: string = "#222222",
  fontSize: number = 32,
): THREE.Texture {
  // Create a canvas for the text
  const padding = Math.max(8, Math.floor(fontSize * 0.4));
  const font = `bold ${fontSize}px Arial, sans-serif`;

  // Measure text first using a temporary canvas context
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.font = font;
  const metrics = tempCtx.measureText(signText);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.4);

  // Make canvas size power-of-two for better GPU sampling
  const toPow2 = (n: number) => {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
  };
  const canvasWidth = toPow2(textWidth + padding * 2);
  const canvasHeight = toPow2(textHeight + padding * 2);

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Fallback texture if 2D context is unavailable
    const fallback = new THREE.Texture();
    return fallback;
  }

  // Background with slight rounded rect
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const radius = Math.min(12, Math.floor(padding * 0.6));
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.moveTo(padding + radius, padding);
  ctx.lineTo(canvasWidth - padding - radius, padding);
  ctx.quadraticCurveTo(
    canvasWidth - padding,
    padding,
    canvasWidth - padding,
    padding + radius,
  );
  ctx.lineTo(canvasWidth - padding, canvasHeight - padding - radius);
  ctx.quadraticCurveTo(
    canvasWidth - padding,
    canvasHeight - padding,
    canvasWidth - padding - radius,
    canvasHeight - padding,
  );
  ctx.lineTo(padding + radius, canvasHeight - padding);
  ctx.quadraticCurveTo(
    padding,
    canvasHeight - padding,
    padding,
    canvasHeight - padding - radius,
  );
  ctx.lineTo(padding, padding + radius);
  ctx.quadraticCurveTo(padding, padding, padding + radius, padding);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.font = font;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Optional subtle shadow for readability
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = Math.floor(fontSize * 0.15);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.floor(fontSize * 0.08);

  ctx.fillText(signText || "", canvasWidth / 2, canvasHeight / 2);

  // Create THREE texture
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}

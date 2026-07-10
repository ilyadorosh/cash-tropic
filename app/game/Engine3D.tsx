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
import {
  createPlayer as createNcaPlayer,
  fetchWeights as fetchNcaWeights,
  type Player as NcaPlayer,
} from "@/app/nca/player/engine";
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
import { TrafficSystem, VEHICLE_STATS } from "./TrafficSystem";
// Add import
import { InteriorSystem } from "./InteriorSystem";
// Add to Engine.tsx imports:
import { GameManager } from "./GameManager";
import { getAllLessons, getNextLesson, Lesson } from "./LearningJourney";
// Add these imports
import MobileControls from "./MobileControls";
import MissionOverview from "./MissionOverviewClean";
import { PrayerModal } from "./PrayerModal";
import { NeuralCity } from "./NeuralCity";
import { ServiceProvider } from "@/app/constant";
import { ModelType, useAppConfig } from "@/app/store/config";
import { useChatStore } from "@/app/store/chat";
// real cities from OpenStreetMap + the physics exhibits that live in them
import {
  DISTRICTS,
  loadDistrict,
  buildConnectors,
  connectorRoads,
  createEntangledPortals,
  createDoubleSlit,
  type PortalPair,
  type DoubleSlit,
  type BuiltDistrict,
} from "./RealDistricts";

// scratch vector for the traffic spawn view-cone check (no per-frame alloc)
const _trafficViewDir = new THREE.Vector3();

// region map extent: core city plus all real OSM districts, with margins
const MAP_WORLD = { minX: -2400, maxX: 3200, minZ: -4200, maxZ: 800 };

type ModelWeather = "clear" | "rain" | "fog";

type GameModelSnapshot = {
  model: string;
  providerName: string;
  temperature: number;
  weather: ModelWeather;
};

type ModelZoneDefinition = {
  id: string;
  label: string;
  model: ModelType;
  providerName: ServiceProvider;
  temperature: number;
  position: [number, number, number];
  color: number;
  subtitle: string;
};

const MODEL_ZONES: ModelZoneDefinition[] = [
  {
    id: "scout",
    label: "Scout",
    model: "meta-llama/llama-4-scout-17b-16e-instruct" as ModelType,
    providerName: ServiceProvider.Groq,
    temperature: 0.2,
    position: [-18, 0, 185],
    color: 0x46e0ff,
    subtitle: "low temp, direct answers",
  },
  {
    id: "compound",
    label: "Compound",
    model: "groq/compound" as ModelType,
    providerName: ServiceProvider.Groq,
    temperature: 0.55,
    position: [0, 0, 170],
    color: 0xffcc33,
    subtitle: "mixed tool routing",
  },
  {
    id: "versatile",
    label: "70B Versatile",
    model: "llama-3.3-70b-versatile" as ModelType,
    providerName: ServiceProvider.Groq,
    temperature: 0.9,
    position: [18, 0, 185],
    color: 0xff6aa3,
    subtitle: "hotter exploration",
  },
];

function compactModelName(model: string) {
  return model
    .replace(/^meta-llama\//, "")
    .replace(/^openai\//, "")
    .replace(/-instruct$/i, "")
    .replace(/-17b-16e/i, "")
    .replace(/llama-3\.3-/i, "llama ")
    .slice(0, 34);
}

function weatherForModel(model: string, temperature = 0.2): ModelWeather {
  const normalized = model.toLowerCase();
  if (normalized.includes("compound")) return "fog";
  if (temperature >= 0.75) return "rain";
  if (temperature >= 0.4) return "fog";
  return "clear";
}

function weatherIcon(weather: ModelWeather, dayPhase: number) {
  if (weather === "rain") return "rain";
  if (weather === "fog") return "fog";
  return dayPhase < 0.23 || dayPhase > 0.77 ? "night" : "clear";
}

function readActiveGameModelConfig() {
  const appModelConfig = useAppConfig.getState().modelConfig;
  try {
    return (
      useChatStore.getState().currentSession()?.mask?.modelConfig ??
      appModelConfig
    );
  } catch {
    return appModelConfig;
  }
}

function makeGameModelSnapshot(): GameModelSnapshot {
  const config = readActiveGameModelConfig();
  const temperature =
    typeof config.temperature === "number" ? config.temperature : 0.2;
  return {
    model: config.model,
    providerName: String(config.providerName || ServiceProvider.Groq),
    temperature,
    weather: weatherForModel(config.model, temperature),
  };
}

function sameModelSnapshot(a: GameModelSnapshot, b: GameModelSnapshot) {
  return (
    a.model === b.model &&
    a.providerName === b.providerName &&
    Math.abs(a.temperature - b.temperature) < 0.001 &&
    a.weather === b.weather
  );
}

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

export default function GTAEngine3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  // the living terrain: a neural cellular automaton rising out of the city
  const ncaLifeRef = useRef<NcaPlayer | null>(null);
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
    gamma: 1,
  });
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [onFoot, setOnFoot] = useState(false);
  const [showSurrenderPrompt, setShowSurrenderPrompt] = useState(false);
  const [modelHud, setModelHud] = useState<GameModelSnapshot>(() =>
    makeGameModelSnapshot(),
  );

  // Add refs:
  const cityDbRef = useRef<CityDatabase | null>(null);
  const trafficRef = useRef<TrafficSystem | null>(null);
  const cityBlocksRef = useRef<CityBlock[]>([]);
  const moneyRef = useRef(500);

  // === REGION MAP (M / ESC / minimap click) ===
  const [showMap, setShowMap] = useState(false);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  // live player state for the map, written by the animate loop
  const playerMarkerRef = useRef({ x: 0, z: 200, heading: 0 });
  // loaded districts + portal anchors, written by the async district loader
  const regionDataRef = useRef<{
    districts: BuiltDistrict[];
    portals: {
      a: { x: number; z: number };
      b: { x: number; z: number };
    } | null;
  }>({ districts: [], portals: null });
  // set-waypoint function installed by the engine effect (moves the beacon)
  const setWaypointFnRef = useRef<((x: number, z: number) => void) | null>(
    null,
  );
  const waypointRef = useRef<{ x: number; z: number } | null>(null);
  // current map projection (world→screen), for the click→waypoint inverse
  const mapProjRef = useRef({ s: 1, ox: 0, oz: 0 });

  // draw the region map while it's open (repaints for the moving player dot)
  useEffect(() => {
    if (!showMap) return;
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const s = Math.min(
        cw / (MAP_WORLD.maxX - MAP_WORLD.minX),
        ch / (MAP_WORLD.maxZ - MAP_WORLD.minZ),
      );
      const ox = (cw - (MAP_WORLD.maxX - MAP_WORLD.minX) * s) / 2;
      const oz = (ch - (MAP_WORLD.maxZ - MAP_WORLD.minZ) * s) / 2;
      mapProjRef.current = { s, ox, oz };
      const X = (wx: number) => ox + (wx - MAP_WORLD.minX) * s;
      const Z = (wz: number) => oz + (wz - MAP_WORLD.minZ) * s;

      // grass night
      ctx.fillStyle = "#0b1409";
      ctx.fillRect(0, 0, cw, ch);

      // autobahn connectors (drawn first, under everything)
      ctx.strokeStyle = "#6a6a6a";
      ctx.lineWidth = 3;
      for (const road of connectorRoads()) {
        ctx.beginPath();
        road.pts.forEach(([x, z], i) =>
          i === 0 ? ctx.moveTo(X(x), Z(z)) : ctx.lineTo(X(x), Z(z)),
        );
        ctx.stroke();
        const mid = road.pts[Math.floor(road.pts.length / 2)];
        ctx.fillStyle = "#8fb7d6";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(road.name, X(mid[0]), Z(mid[1]) - 4);
      }

      // core city streets
      ctx.strokeStyle = "rgba(220,220,220,0.75)";
      ctx.lineWidth = 1;
      for (const st of NUERNBERG_STREETS) {
        ctx.beginPath();
        ctx.moveTo(X(st.start.x), Z(st.start.z));
        ctx.lineTo(X(st.end.x), Z(st.end.z));
        ctx.stroke();
      }
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NÜRNBERG — deine Stadt", X(0), Z(320));

      // real OSM districts
      for (const d of regionDataRef.current.districts) {
        const hex = "#" + d.def.accent.toString(16).padStart(6, "0");
        ctx.strokeStyle = "rgba(200,210,220,0.6)";
        ctx.lineWidth = 0.8;
        for (const st of d.json.streets) {
          ctx.beginPath();
          st.pts.forEach(([x, z], i) => {
            const wx = d.def.offset.x + x;
            const wz = d.def.offset.z + z;
            i === 0 ? ctx.moveTo(X(wx), Z(wz)) : ctx.lineTo(X(wx), Z(wz));
          });
          ctx.stroke();
        }
        // landmarks as gold dots, a few named
        d.landmarks.slice(0, 12).forEach((l, i) => {
          ctx.beginPath();
          ctx.arc(X(l.x), Z(l.z), 2, 0, Math.PI * 2);
          ctx.fillStyle = "#ffd54a";
          ctx.fill();
          if (i < 2) {
            ctx.fillStyle = "rgba(255,213,74,0.9)";
            ctx.font = "9px system-ui, sans-serif";
            ctx.fillText(
              l.name.length > 34 ? l.name.slice(0, 33) + "…" : l.name,
              X(l.x),
              Z(l.z) - 5,
            );
          }
        });
        ctx.fillStyle = hex;
        ctx.font = "700 13px system-ui, sans-serif";
        ctx.fillText(
          d.def.name.toUpperCase(),
          X(d.def.offset.x),
          Z(d.def.offset.z - d.json.sizeMeters / 2 - 40),
        );
      }

      // entangled portals: violet pair joined by a dashed thread
      const portals = regionDataRef.current.portals;
      if (portals) {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = "#b46bff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(X(portals.a.x), Z(portals.a.z));
        ctx.lineTo(X(portals.b.x), Z(portals.b.z));
        ctx.stroke();
        ctx.setLineDash([]);
        for (const p of [portals.a, portals.b]) {
          ctx.beginPath();
          ctx.arc(X(p.x), Z(p.z), 4, 0, Math.PI * 2);
          ctx.strokeStyle = "#b46bff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // spawn — home
      ctx.beginPath();
      ctx.arc(
        X(PLAYER_SPAWN.position.x),
        Z(PLAYER_SPAWN.position.z),
        4,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "#39d353";
      ctx.fill();
      ctx.fillStyle = "#39d353";
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillText(
        "HOME",
        X(PLAYER_SPAWN.position.x),
        Z(PLAYER_SPAWN.position.z) + 14,
      );

      // waypoint
      const wp = waypointRef.current;
      if (wp) {
        ctx.strokeStyle = "#ffd54a";
        ctx.lineWidth = 2;
        const wx = X(wp.x);
        const wz = Z(wp.z);
        ctx.beginPath();
        ctx.moveTo(wx - 5, wz - 5);
        ctx.lineTo(wx + 5, wz + 5);
        ctx.moveTo(wx + 5, wz - 5);
        ctx.lineTo(wx - 5, wz + 5);
        ctx.stroke();
      }

      // player — red arrow with heading (forward = (sin h, cos h) in x/z)
      const pm = playerMarkerRef.current;
      ctx.save();
      ctx.translate(X(pm.x), Z(pm.z));
      ctx.rotate(Math.atan2(Math.cos(pm.heading), Math.sin(pm.heading)));
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -4.5);
      ctx.lineTo(-5, 4.5);
      ctx.closePath();
      ctx.fillStyle = "#ff5252";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    draw();
    const iv = setInterval(draw, 300);
    return () => clearInterval(iv);
  }, [showMap]);

  const onMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { s, ox, oz } = mapProjRef.current;
    const wx = MAP_WORLD.minX + (e.clientX - rect.left - ox) / s;
    const wz = MAP_WORLD.minZ + (e.clientY - rect.top - oz) / s;
    setWaypointFnRef.current?.(wx, wz);
  };

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

  // key handlers live in a once-registered closure — they need a ref,
  // not React state, to know whether a dialogue is open (stale-closure fix:
  // Space-to-skip never worked because `dialogue` was frozen at null)
  const dialogueOpenRef = useRef<Dialogue | null>(null);
  useEffect(() => {
    dialogueOpenRef.current = dialogue;
  }, [dialogue]);

  // Dialogue handler with options support
  const handleDialogue = useCallback((d: Dialogue) => {
    setDialogue(d);
    if (d.text) {
      const char = Object.values(CHARACTERS).find((c) => c.name === d.title);
      speak(d.text, char?.voicePitch || 1, char?.voiceRate || 1);
    }
  }, []);

  const handleReward = useCallback((money: number, respect: number) => {
    moneyRef.current += money;
    setStats((s) => ({
      ...s,
      money: moneyRef.current,
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
  const handleMobileMove = useCallback(({ x, y }: { x: number; y: number }) => {
    keysRef.current["w"] = y > 0.3;
    keysRef.current["s"] = y < -0.3;
    keysRef.current["a"] = x < -0.3;
    keysRef.current["d"] = x > 0.3;
  }, []);

  const handleMobileAction = useCallback(
    (action: "interact" | "attack" | "mission" | "brake") => {
      switch (action) {
        case "interact":
          if (onKeyDownRef.current) {
            onKeyDownRef.current(new KeyboardEvent("keydown", { key: "e" }));
          }
          break;
        case "attack":
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
    // fog and far plane sized for the real-world districts: Fürth, Erlangen
    // and Berlin sit 1200–3400 units out and must be visible on the horizon
    scene.fog = new THREE.Fog(0x87ceeb, 50, 2600);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      8000,
    );
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // === ATMOSPHERE — day/night cycle + weather. Cheap on purpose:
    // color lerps, one directional sun, one Points cloud for rain.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const sun = new THREE.DirectionalLight(0xfff3e0, 0.7);
    sun.position.set(60, 80, 30);
    scene.add(sun);
    // t, sky, fog, sun intensity, exposure
    const atmoStops: [number, number, number, number, number][] = [
      [0.0, 0x0a1226, 0x0a1430, 0.05, 0.5],
      [0.25, 0xf5b880, 0xd8a070, 0.5, 0.85],
      [0.5, 0x87ceeb, 0x9fc4e0, 0.75, 1.1],
      [0.75, 0xe98a5a, 0xc07850, 0.45, 0.8],
      [1.0, 0x0a1226, 0x0a1430, 0.05, 0.5],
    ];
    const DAY_LEN = 240; // seconds per in-game day
    let atmoT = DAY_LEN * 0.35; // start mid-morning
    const _atmoA = new THREE.Color(),
      _atmoB = new THREE.Color();
    let currentWeather = makeGameModelSnapshot().weather;
    let raining = currentWeather === "rain";
    let lastModelWeatherSync = 0;
    const RAIN_N = 1100;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(RAIN_N * 3);
    for (let i = 0; i < RAIN_N; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 120;
      rainPos[i * 3 + 1] = Math.random() * 50;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const rain = new THREE.Points(
      rainGeo,
      new THREE.PointsMaterial({
        color: 0xa8c4e6,
        size: 0.14,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    rain.visible = raining;
    scene.add(rain);

    function setWeather(nextWeather: ModelWeather) {
      currentWeather = nextWeather;
      raining = nextWeather === "rain";
      rain.visible = raining;
    }

    function syncModelWeather(force = false) {
      const now = performance.now();
      if (!force && now - lastModelWeatherSync < 800) return;
      lastModelWeatherSync = now;
      const snapshot = makeGameModelSnapshot();
      if (currentWeather !== snapshot.weather) {
        setWeather(snapshot.weather);
      }
      setModelHud((prev) =>
        sameModelSnapshot(prev, snapshot) ? prev : snapshot,
      );
    }

    syncModelWeather(true);

    // floating name tags (canvas sprite — names make a city a society)
    function makeTextSprite(text: string, color = "#ffffff") {
      const pad = 10,
        fs = 44;
      const cnv = document.createElement("canvas");
      const m = cnv.getContext("2d")!;
      m.font = `600 ${fs}px monospace`;
      cnv.width = Math.ceil(m.measureText(text).width) + pad * 2;
      cnv.height = fs + pad * 2;
      const c = cnv.getContext("2d")!;
      c.font = `600 ${fs}px monospace`;
      c.fillStyle = "rgba(6,9,18,0.72)";
      c.fillRect(0, 0, cnv.width, cnv.height);
      c.fillStyle = color;
      c.textBaseline = "middle";
      c.fillText(text, pad, cnv.height / 2);
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(cnv),
          transparent: true,
          depthWrite: false,
        }),
      );
      spr.scale.set(cnv.width / 28, cnv.height / 28, 1);
      spr.position.y = 5;
      return spr;
    }

    // GTA-style clock: in-game day/time + weather, top right
    const clockEl = document.createElement("div");
    clockEl.style.cssText =
      "position:fixed;top:12px;right:14px;z-index:40;font:600 15px/1.4 monospace;" +
      "color:#eaf6ff;background:rgba(6,9,18,.62);border:1px solid rgba(70,224,255,.25);" +
      "border-radius:8px;padding:6px 12px;letter-spacing:.08em;pointer-events:none";
    clockEl.textContent = "TAG 1 · 08:24 ☀️";
    document.body.appendChild(clockEl);
    let lastClockTick = -1;
    let labelsDone = false;
    function updateAtmosphere(dt: number) {
      atmoT += dt;
      const t = (atmoT % DAY_LEN) / DAY_LEN;
      let i = 0;
      while (i < atmoStops.length - 2 && t > atmoStops[i + 1][0]) i++;
      const a = atmoStops[i],
        b = atmoStops[i + 1];
      const f = (t - a[0]) / (b[0] - a[0] || 1);
      const sky = _atmoA.setHex(a[1]).lerp(_atmoB.setHex(b[1]), f).clone();
      const fogC = _atmoA.setHex(a[2]).lerp(_atmoB.setHex(b[2]), f).clone();
      let sunI = a[3] + (b[3] - a[3]) * f;
      let expo = a[4] + (b[4] - a[4]) * f;
      const foggy = currentWeather === "fog";
      if (raining) {
        sky.multiplyScalar(0.55);
        fogC.multiplyScalar(0.55);
        sunI *= 0.5;
        expo *= 0.85;
      } else if (foggy) {
        sky.multiplyScalar(0.78);
        fogC.multiplyScalar(0.72);
        sunI *= 0.65;
        expo *= 0.92;
      }
      if (scene.background instanceof THREE.Color) scene.background.copy(sky);
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.copy(fogC);
        scene.fog.near = raining ? 18 : foggy ? 8 : 50;
        // clear days reveal the whole metropolitan region: the old town AND
        // the real OSM districts on the horizon (Fürth, Erlangen, Berlin,
        // 1200–3400 units out). Weather still swallows them — as in life.
        scene.fog.far = raining ? 150 : foggy ? 95 : 2600;
      }
      sun.intensity = sunI;
      const ang = (t - 0.25) * Math.PI * 2;
      sun.position.set(Math.cos(ang) * 80, Math.max(6, Math.sin(ang) * 90), 30);
      renderer.toneMappingExposure = expo;
      const clockTick = Math.floor(atmoT * 2);
      if (clockTick !== lastClockTick) {
        lastClockTick = clockTick;
        const day = Math.floor(atmoT / DAY_LEN) + 1;
        const hours = t * 24;
        const hh = String(Math.floor(hours)).padStart(2, "0");
        const mm = String(Math.floor((hours % 1) * 60)).padStart(2, "0");
        const snapshot = makeGameModelSnapshot();
        const icon = weatherIcon(currentWeather, t).toUpperCase();
        clockEl.textContent = `TAG ${day} · ${hh}:${mm} · ${icon} · T ${snapshot.temperature.toFixed(1)}`;
      }
      syncModelWeather();
      if (raining) {
        rain.position.set(camera.position.x, 0, camera.position.z);
        const p = rainGeo.attributes.position as THREE.BufferAttribute;
        for (let k = 0; k < RAIN_N; k++) {
          let y = p.getY(k) - dt * 42;
          if (y < 0) y = 45 + Math.random() * 5;
          p.setY(k, y);
        }
        p.needsUpdate = true;
      }
    }

    const colliders: THREE.Mesh[] = [];
    const interactables: any[] = [];
    initWorld(scene, colliders, interactables);

    // === THE LIVING TERRAIN — a neural net IS part of the world ===
    // Expensive on weak clients, so it lazy-loads and wakes around thermal/model
    // moments instead of running from the first frame forever.
    const lowPowerClient =
      (navigator as any).deviceMemory <= 4 ||
      navigator.hardwareConcurrency <= 4 ||
      /Mobi|Android/i.test(navigator.userAgent);
    const NCA_GS = lowPowerClient ? 64 : 96;
    const NCA_UPLOAD_EVERY = lowPowerClient ? 12 : 5;
    const ncaSrcCanvas = document.createElement("canvas");
    let ncaTex: THREE.CanvasTexture | null = null;
    let ncaMirrorCtx: CanvasRenderingContext2D | null = null;
    let ncaSrc: HTMLCanvasElement | null = null;
    let ncaHeights: Uint8ClampedArray | null = null;
    let ncaLoading = false;
    let ncaUnavailable = false;
    let ncaActive = false;
    let ncaWakeUntil = 0;

    function sampleNcaFrame() {
      if (!ncaTex || !ncaMirrorCtx || !ncaSrc) return;
      ncaMirrorCtx.drawImage(ncaSrc, 0, 0);
      ncaTex.needsUpdate = true;
      ncaHeights = ncaMirrorCtx.getImageData(
        0,
        0,
        ncaSrc.width,
        ncaSrc.height,
      ).data;
    }

    function setNcaActive(active: boolean) {
      if (ncaActive === active) return;
      ncaActive = active;
      ncaLifeRef.current?.setPlaying(active);
    }

    async function ensureNcaLoaded() {
      if (ncaLifeRef.current || ncaLoading || ncaUnavailable) return;
      ncaLoading = true;
      try {
        const weights = await fetchNcaWeights();
        if (!weights) {
          ncaUnavailable = true;
          return;
        }
        const nca = createNcaPlayer(
          ncaSrcCanvas,
          () => {},
          () => {},
          { preserveDrawingBuffer: true },
        );
        if (!nca) {
          ncaUnavailable = true;
          return;
        }
        const meta = nca.loadModel(weights, {
          gridSize: NCA_GS,
          seeds: lowPowerClient ? 8 : 14,
          canvasScale: 1,
          background: "#000000", // dead cells cut away via alphaTest
        });
        if (!meta) {
          ncaUnavailable = true;
          return;
        }

        ncaLifeRef.current = nca;
        nca.params.speed = lowPowerClient ? 0.75 : 1;
        nca.params.stepEvery = lowPowerClient ? 4 : 2;
        nca.setPlaying(ncaActive);

        const mirror = document.createElement("canvas");
        mirror.width = ncaSrcCanvas.width;
        mirror.height = ncaSrcCanvas.height;
        const mctx = mirror.getContext("2d");
        if (!mctx) {
          ncaUnavailable = true;
          return;
        }
        mctx.drawImage(ncaSrcCanvas, 0, 0);

        const tex = new THREE.CanvasTexture(mirror);
        const geo = new THREE.PlaneGeometry(300, 300, NCA_GS, NCA_GS);
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          displacementMap: tex, // brightness -> height: life literally rises
          displacementScale: 26,
          alphaMap: tex,
          alphaTest: 0.14,
          roughness: 0.85,
        });
        const living = new THREE.Mesh(geo, mat);
        living.rotation.x = -Math.PI / 2;
        living.position.y = 0.08;
        living.name = "living-terrain";
        scene.add(living);

        ncaTex = tex;
        ncaMirrorCtx = mctx;
        ncaSrc = ncaSrcCanvas;
        sampleNcaFrame();
      } catch (e) {
        ncaUnavailable = true;
        console.warn("living terrain (3D) failed:", e);
      } finally {
        ncaLoading = false;
      }
    }

    function wakeNca(ms = 9000) {
      ncaWakeUntil = Math.max(ncaWakeUntil, performance.now() + ms);
      setNcaActive(true);
      void ensureNcaLoaded();
    }

    // Height of the living terrain at a world point. Reads the same red
    // channel THREE's displacementMap uses, from the CPU-side mirror pixels —
    // one array lookup, no GPU readback, no physics engine. You can drive
    // up a neural network.
    function terrainHeightAt(wx: number, wz: number): number {
      if (!ncaHeights || !ncaSrc) return 0;
      const W = ncaSrc.width,
        H = ncaSrc.height;
      const mx = Math.min(
        W - 1,
        Math.max(0, Math.floor(((wx + 150) / 300) * W)),
      );
      const my = Math.min(
        H - 1,
        Math.max(0, Math.floor(((wz + 150) / 300) * H)),
      );
      const r = ncaHeights[(my * W + mx) * 4] / 255;
      // below alphaTest the mesh is cut away — flat ground there
      return r > 0.14 ? r * 26 + 0.08 : 0;
    }

    // wound the living terrain at a world point (gunfire, explosions, …)
    function woundTerrainAt(wx: number, wz: number, r = 4) {
      wakeNca(12000);
      const nca = ncaLifeRef.current;
      if (!nca || !ncaSrc) return;
      nca.damageAtCell(
        ((wx + 150) / 300) * ncaSrc.width,
        ((wz + 150) / 300) * ncaSrc.height,
        r,
      );
    }

    // === YOUR CITY, FROM THE 2D EDITOR ===
    // The same /api/game map+buildings the 2D editor writes, extruded into
    // the 3D world at true scale (2000px map -> 300 world units). Cyan rims
    // mark what was born in the editor.
    (async () => {
      try {
        const [mapRes, bRes] = await Promise.all([
          fetch("/api/game/map"),
          fetch("/api/game/buildings"),
        ]);
        console.log("editor city fetch:", mapRes.status, bRes.status);
        if (!mapRes.ok || !bRes.ok) return;
        const map2d = await mapRes.json();
        const blds = await bRes.json();
        const mw = map2d.width || 2000,
          mh = map2d.height || 2000;
        const S = 300 / Math.max(mw, mh);
        const ox = mw / 2,
          oz = mh / 2;
        // one city: the editor's work is its own district east of the old
        // town, connected by road — no overlap, one continuous world
        const DX = 340,
          DZ = 0;
        const g = new THREE.Group();
        g.name = "editor-city";
        function distancePointToSegment(
          px: number,
          pz: number,
          ax: number,
          az: number,
          bx: number,
          bz: number,
        ) {
          const abx = bx - ax;
          const abz = bz - az;
          const apx = px - ax;
          const apz = pz - az;
          const abLenSq = abx * abx + abz * abz;
          if (abLenSq === 0) {
            return {
              dist: Math.hypot(apx, apz),
              cx: ax,
              cz: az,
            };
          }

          const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
          const cx = ax + abx * t;
          const cz = az + abz * t;
          return {
            dist: Math.hypot(px - cx, pz - cz),
            cx,
            cz,
          };
        }

        function resolveBuildingFootprint(building: any): {
          x: number;
          y: number;
          adjusted: boolean;
        } {
          const width = Math.max(8, building.width || 40);
          const depth = Math.max(8, building.height || 40);
          const buildingRadius = Math.hypot(width, depth) / 2 + 4;
          let centerX = building.position.x + width / 2;
          let centerZ = building.position.y + depth / 2;
          let adjusted = false;

          for (let pass = 0; pass < 2; pass++) {
            let nearest: {
              dist: number;
              cx: number;
              cz: number;
              roadWidth: number;
              sx: number;
              sz: number;
              ex: number;
              ez: number;
            } | null = null;

            for (const road of Array.isArray(map2d.roads) ? map2d.roads : []) {
              const pts = road?.points || [];
              for (let i = 0; i + 1 < pts.length; i++) {
                const segment = distancePointToSegment(
                  centerX,
                  centerZ,
                  pts[i].x,
                  pts[i].y,
                  pts[i + 1].x,
                  pts[i + 1].y,
                );
                const neededDistance = (road.width || 20) / 2 + buildingRadius;
                if (segment.dist < neededDistance) {
                  if (!nearest || segment.dist < nearest.dist) {
                    nearest = {
                      dist: segment.dist,
                      cx: segment.cx,
                      cz: segment.cz,
                      roadWidth: road.width || 20,
                      sx: pts[i].x,
                      sz: pts[i].y,
                      ex: pts[i + 1].x,
                      ez: pts[i + 1].y,
                    };
                  }
                }
              }
            }

            if (!nearest) break;

            let awayX = centerX - nearest.cx;
            let awayZ = centerZ - nearest.cz;
            if (awayX === 0 && awayZ === 0) {
              const dx = nearest.ex - nearest.sx;
              const dz = nearest.ez - nearest.sz;
              awayX = -dz;
              awayZ = dx;
            }

            const len = Math.hypot(awayX, awayZ) || 1;
            const push =
              nearest.roadWidth / 2 + buildingRadius - nearest.dist + 2;
            centerX += (awayX / len) * push;
            centerZ += (awayZ / len) * push;
            adjusted = true;
          }

          return {
            x: centerX - width / 2,
            y: centerZ - depth / 2,
            adjusted,
          };
        }

        const rimMat = new THREE.MeshStandardMaterial({
          color: 0x06121e,
          emissive: 0x46e0ff,
          emissiveIntensity: 1.2,
        });
        const roadMat = new THREE.MeshStandardMaterial({
          color: 0x2b3444,
          roughness: 0.95,
        });
        (Array.isArray(blds) ? blds : []).forEach((b: any) => {
          if (!b?.position) return;
          const w = Math.max(2, (b.width || 40) * S);
          const d = Math.max(2, (b.height || 40) * S);
          const h =
            5 + Math.min(22, ((b.width || 40) + (b.height || 40)) * 0.055);
          const resolved = resolveBuildingFootprint(b);
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({
              color: new THREE.Color(b.color || "#718096"),
              metalness: 0.4,
              roughness: 0.7,
            }),
          );
          mesh.position.set(
            (resolved.x + (b.width || 40) / 2 - ox) * S + DX,
            h / 2,
            (resolved.y + (b.height || 40) / 2 - oz) * S + DZ,
          );
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.name = "editor:" + (b.name || b.id || "building");
          g.add(mesh);
          colliders.push(mesh);
          const rim = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.15, 0.14, d + 0.15),
            rimMat,
          );
          rim.position.set(mesh.position.x, h, mesh.position.z);
          g.add(rim);
          const emoji =
            (
              {
                factory: "🏭",
                shop: "🏪",
                house: "🏠",
                church: "⛪",
                office: "🏢",
                school: "🏫",
              } as Record<string, string>
            )[b.type] || "🏢";
          if (b.name) {
            const tag = makeTextSprite(emoji + " " + b.name, "#9fe8ff");
            tag.position.set(mesh.position.x, h + 3, mesh.position.z);
            g.add(tag);
          }
        });
        (map2d.roads || []).forEach((r: any) => {
          const pts = r?.points || [];
          for (let i = 0; i + 1 < pts.length; i++) {
            const ax = (pts[i].x - ox) * S + DX,
              az = (pts[i].y - oz) * S + DZ;
            const bx = (pts[i + 1].x - ox) * S + DX,
              bz = (pts[i + 1].y - oz) * S + DZ;
            const len = Math.hypot(bx - ax, bz - az);
            if (len < 0.01) continue;
            const seg = new THREE.Mesh(
              new THREE.BoxGeometry(Math.max(1, (r.width || 20) * S), 0.1, len),
              roadMat,
            );
            seg.position.set((ax + bx) / 2, 0.05, (az + bz) / 2);
            seg.rotation.y = Math.atan2(bx - ax, bz - az);
            g.add(seg);
          }
        });
        // the road east, and a gate so you know you're entering your own work
        const conn = new THREE.Mesh(new THREE.BoxGeometry(60, 0.1, 8), roadMat);
        conn.position.set(165, 0.05, DZ);
        g.add(conn);
        for (const side of [-1, 1]) {
          const pillar = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 9, 0.8),
            rimMat,
          );
          pillar.position.set(192, 4.5, DZ + 6 * side);
          g.add(pillar);
        }
        const lintel = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.8, 13.5),
          rimMat,
        );
        lintel.position.set(192, 9.2, DZ);
        g.add(lintel);

        // a pillar of light so the district is findable from anywhere
        const beacon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 90, 8, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0x46e0ff,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        beacon.position.set(192, 45, DZ);
        g.add(beacon);
        const beaconLight = new THREE.PointLight(0x46e0ff, 1.6, 60);
        beaconLight.position.set(192, 12, DZ);
        g.add(beaconLight);

        // G = go to your city (teleport to the gate)
        window.addEventListener("keydown", (ev) => {
          if (ev.key.toLowerCase() !== "g") return;
          try {
            const rider = playerState === "driving" ? activeCar : playerGroup;
            rider.position.x = 200;
            rider.position.z = DZ;
          } catch {}
        });

        scene.add(g);
        console.log(
          `editor city: ${Array.isArray(blds) ? blds.length : 0} buildings, ${(map2d.roads || []).length} roads — east district at x≈+340, drive +X through the cyan gate (or press G)`,
        );
      } catch (e) {
        console.warn("editor city failed:", e);
      }
    })();

    // === THE PEOPLE FROM YOUR DATABASE ===
    // /api/game/npcs (Redis-backed, static fallback) was only ever spawned
    // in the 2D engine. Here they live in 3D: placed at their map positions
    // in the east district, named, and they talk when you WALK UP to them —
    // their full dialogue trees, answered with the 1/2/3 keys.
    const dbNpcs: { mesh: THREE.Group; npc: any; near: boolean }[] = [];

    function openDbDialogue(npc: any, dialogueId?: string) {
      const dlg = dialogueId
        ? (npc.dialogues || []).find((d: any) => d.id === dialogueId)
        : (npc.dialogues || [])[0];
      if (!dlg) return;
      const opts = (dlg.responses || []).map((r: any) => ({
        text: r.text,
        action: () => openDbDialogue(npc, r.nextDialogueId),
      }));
      currentDialogueOptions = opts.length ? opts : null;
      handleDialogue({
        title: npc.name,
        text: dlg.text,
        options: opts.length ? opts : undefined,
      });
      if (!opts.length) setTimeout(() => setDialogue(null), 6000);
    }

    (async () => {
      try {
        const res = await fetch("/api/game/npcs");
        if (!res.ok) return;
        const list = await res.json();
        if (!Array.isArray(list)) return;
        const S = 300 / 2000,
          ox = 1000,
          oz = 1000,
          DX = 340;
        for (const npc of list) {
          if (!npc?.position) continue;
          const grp = new THREE.Group();
          const bodyMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 3, 0.8),
            new THREE.MeshLambertMaterial({
              color: new THREE.Color(npc.color || "#f6e05e"),
            }),
          );
          bodyMesh.position.y = 1.5;
          grp.add(bodyMesh);
          const headMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xffdbac }),
          );
          headMesh.position.y = 3.5;
          grp.add(headMesh);
          grp.add(
            makeTextSprite(
              "💬 " + (npc.name || "???"),
              npc.isHistorical ? "#ffd76e" : "#9fe8ff",
            ),
          );
          grp.position.set(
            (npc.position.x - ox) * S + DX,
            0,
            (npc.position.y - oz) * S,
          );
          scene.add(grp);
          dbNpcs.push({ mesh: grp, npc, near: false });
        }
        console.log(
          `db characters: ${dbNpcs.length} spawned in the east district (walk up to talk)`,
        );
      } catch (e) {
        console.warn("db npcs failed:", e);
      }
    })();

    // (NeuralCity is created once later — a duplicate here leaked 25
    // unmanaged buildings into the scene on every mount)

    // === CITY DATABASE ===
    let money = 500;
    cityDbRef.current = new CityDatabase();
    const savedProgress = cityDbRef.current.getProgress();
    money = savedProgress.money;
    moneyRef.current = money;
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

    // === REAL WORLD DISTRICTS — OpenStreetMap made drivable ===
    // Fürth, Erlangen (MPI für die Physik des Lichts), Nürnberg Altstadt,
    // Berlin Mitte: real streets, real building footprints, connected by
    // the A73/A9 like in life. Physics exhibits live where they belong.
    const physicsWorld = {
      portals: null as PortalPair | null,
      doubleSlit: null as DoubleSlit | null,
    };
    scene.add(buildConnectors());
    (async () => {
      const built = await Promise.all(DISTRICTS.map(loadDistrict));
      let mpi: { x: number; z: number } | null = null;
      let berlin: { x: number; z: number } | null = null;
      for (const d of built) {
        if (!d) continue;
        scene.add(d.group);
        colliders.push(...d.colliders);
        if (d.def.id === "erlangen") {
          const hit = d.landmarks.find((l) =>
            l.name.includes("Physik des Lichts"),
          );
          mpi = hit ?? { x: d.def.offset.x, z: d.def.offset.z };
        }
        if (d.def.id === "berlin") {
          const hit = d.landmarks.find((l) => l.name.includes("Humboldt"));
          berlin = hit ?? { x: d.def.offset.x, z: d.def.offset.z };
        }
        console.log(
          `[districts] ${d.def.name}: ${d.json.streets.length} streets, ` +
            `${d.json.buildings.length} buildings — ${d.json.attribution}`,
        );
      }
      if (mpi && berlin) {
        // non-locality: spukhafte Fernwirkung between Erlangen and Berlin
        const portals = createEntangledPortals(
          { x: mpi.x + 14, z: mpi.z + 14 },
          { x: berlin.x + 14, z: berlin.z + 14 },
        );
        scene.add(portals.a);
        scene.add(portals.b);
        physicsWorld.portals = portals;
        // wave nature: a living double-slit at the institute of light
        const slit = createDoubleSlit({ x: mpi.x - 20, z: mpi.z + 10 });
        scene.add(slit.group);
        physicsWorld.doubleSlit = slit;
      }
      // hand the region to the map overlay
      regionDataRef.current = {
        districts: built.filter((d): d is BuiltDistrict => d !== null),
        portals:
          mpi && berlin
            ? {
                a: { x: mpi.x + 14, z: mpi.z + 14 },
                b: { x: berlin.x + 14, z: berlin.z + 14 },
              }
            : null,
      };
    })();

    // === WAYPOINT BEACON — set from the region map, visible across the world
    const waypointBeaconMat = new THREE.MeshBasicMaterial({
      color: 0xffd54a,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const waypointBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 400, 12, 1, true),
      waypointBeaconMat,
    );
    waypointBeacon.position.y = 200;
    waypointBeacon.visible = false;
    scene.add(waypointBeacon);
    setWaypointFnRef.current = (x: number, z: number) => {
      waypointRef.current = { x, z };
      waypointBeacon.position.set(x, 200, z);
      waypointBeacon.visible = true;
    };

    gameManagerRef.current = new GameManager();

    (async () => {
      // Load saved game (or create new)
      const userId = "player_1"; // TODO: Get from auth
      const { progress, world } =
        await gameManagerRef.current!.loadGame(userId);

      // Restore player state
      money = progress.money;
      moneyRef.current = money;
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

      // (the animate loop points the waypoint beacon at the first active
      // mission once these markers land — see initialBeaconSet)

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

    // The old ROADS-based pavement renderer was retired: this codebase
    // had two independent road networks (ROADS here, NUERNBERG_STREETS for
    // traffic AI) that were never reconciled, so anything placed clear of
    // one still straddled the other. TrafficSystem.drawStreets() (called
    // above) is now the single source of pavement, for both rendering and
    // collision-avoidance.

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
    // Your car waits at the curb beside the spawn, not on top of you —
    // parked parallel like everything else on this street.
    carGroup.position.set(
      PLAYER_SPAWN.position.x + 14,
      0,
      PLAYER_SPAWN.position.z - 6,
    );
    carGroup.rotation.y = 0; // nose north, along the curb line
    scene.add(carGroup);

    // === THE HOOD: parked cars at spawn (GTA SA Grove Street energy) ===
    // A neat parallel-parked row on the east curb. Safe, familiar, cozy —
    // walk up to any of them and press Enter. They're neighborhood cars:
    // taking one raises no stars.
    const makeParkedCar = (color: number): THREE.Group => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 8),
        new THREE.MeshLambertMaterial({ color }),
      );
      body.position.y = 1.5;
      body.castShadow = true;
      g.add(body);
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.5, 4),
        new THREE.MeshLambertMaterial({ color: 0xdddddd }),
      );
      top.position.set(0, 2.75, -0.5);
      top.castShadow = true;
      g.add(top);
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
        g.add(w);
      });
      return g;
    };

    const parkedCars: THREE.Group[] = [];
    // west curb row, evenly spaced, all noses north — nice and neat
    const PARKED_SPOTS: Array<[number, number, number]> = [
      [-14, 190, 0x992222], // oxblood red
      [-14, 202, 0x226644], // racing green
      [-14, 214, 0xb8a24a], // sun-faded gold
    ];
    for (const [px, pz, color] of PARKED_SPOTS) {
      const parked = makeParkedCar(color);
      parked.position.set(PLAYER_SPAWN.position.x + px, 0, pz);
      parked.rotation.y = 0;
      scene.add(parked);
      parkedCars.push(parked);
    }

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

    type AirplaneRuntime = {
      mesh: THREE.Group;
      centerX: number;
      centerZ: number;
      radius: number;
      altitude: number;
      speed: number;
      phase: number;
      propeller?: THREE.Mesh;
    };

    function createAirplane(
      color: number,
      centerX: number,
      centerZ: number,
      radius: number,
      altitude: number,
      speed: number,
      phase = 0,
      propeller = false,
    ): AirplaneRuntime {
      const group = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.55, 8, 10),
        new THREE.MeshLambertMaterial({ color }),
      );
      body.rotation.z = Math.PI / 2;
      group.add(body);

      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 1.6, 10),
        new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }),
      );
      nose.rotation.z = -Math.PI / 2;
      nose.position.x = 4.25;
      group.add(nose);

      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.06, 4.6),
        new THREE.MeshLambertMaterial({ color: 0xdfe8f0 }),
      );
      wing.position.y = 0.05;
      group.add(wing);

      const tailWing = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.08, 1.6),
        new THREE.MeshLambertMaterial({ color: 0xdfe8f0 }),
      );
      tailWing.position.set(-3.5, 0.45, 0);
      group.add(tailWing);

      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.1, 0.9),
        new THREE.MeshLambertMaterial({ color: 0xeaeaea }),
      );
      fin.position.set(-3.5, 0.8, 0);
      group.add(fin);

      const windowBand = new THREE.Mesh(
        new THREE.BoxGeometry(5.8, 0.16, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x1f4b66 }),
      );
      windowBand.position.set(0.5, 0.22, 0.55);
      group.add(windowBand);

      let propellerMesh: THREE.Mesh | undefined;
      if (propeller) {
        const spinner = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8),
          new THREE.MeshBasicMaterial({ color: 0x222222 }),
        );
        spinner.rotation.z = Math.PI / 2;
        spinner.position.set(4.8, 0, 0);
        group.add(spinner);
        propellerMesh = spinner;
      }

      group.position.set(centerX + radius, altitude, centerZ);
      scene.add(group);

      return {
        mesh: group,
        centerX,
        centerZ,
        radius,
        altitude,
        speed,
        phase,
        propeller: propellerMesh,
      };
    }

    const airplanes: AirplaneRuntime[] = [
      createAirplane(0xffffff, 0, 0, 220, 155, 0.18, 0),
      createAirplane(0xffcc66, -140, 95, 170, 95, 0.24, Math.PI / 2, true),
    ];

    // === CRASH DAMAGE — sparks + a visible dent, not just a speed penalty ===
    type ImpactSpark = {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
    };
    const impactSparks: ImpactSpark[] = [];
    function spawnImpactSparks(
      x: number,
      y: number,
      z: number,
      count = 8,
      color = 0xffaa33,
    ) {
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.16, 0.16),
          new THREE.MeshBasicMaterial({ color }),
        );
        m.position.set(x, y, z);
        scene.add(m);
        impactSparks.push({
          mesh: m,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.55,
            Math.random() * 0.35 + 0.15,
            (Math.random() - 0.5) * 0.55,
          ),
          life: 16 + Math.random() * 10,
        });
      }
    }

    // Darkens whatever materials a vehicle mesh happens to have — works for
    // the player's car, any traffic vehicle type, and police cars alike,
    // without needing to know each one's internal mesh structure.
    function applyVehicleDamage(vehicleMesh: THREE.Object3D, amount: number) {
      const dmg = Math.min(1, (vehicleMesh.userData.damage || 0) + amount);
      vehicleMesh.userData.damage = dmg;
      vehicleMesh.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const mat of mats) {
          const m = mat as THREE.MeshLambertMaterial;
          if (!m || !("color" in m)) continue;
          if (m.userData.origColor === undefined) {
            m.userData.origColor = m.color.getHex();
          }
          const orig = new THREE.Color(m.userData.origColor);
          m.color.copy(orig).lerp(new THREE.Color(0x100b06), dmg * 0.65);
        }
      });
      const squish = 1 - dmg * 0.08;
      vehicleMesh.scale.set(squish, 1, squish);
    }

    type MoneyDrop = {
      mesh: THREE.Group;
      velocity: THREE.Vector3;
      amount: number;
      life: number;
    };
    const moneyDrops: MoneyDrop[] = [];

    function spawnMoneyDrop(
      x: number,
      z: number,
      amount: number,
      impulse = new THREE.Vector3(),
    ) {
      const group = new THREE.Group();
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12),
        new THREE.MeshStandardMaterial({
          color: 0xffd34d,
          emissive: 0x553300,
          emissiveIntensity: 0.25,
          metalness: 0.35,
          roughness: 0.4,
        }),
      );
      coin.rotation.x = Math.PI / 2;
      group.add(coin);

      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.75, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffee88,
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
        }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -0.04;
      group.add(glow);

      group.position.set(x, 2.2, z);
      scene.add(group);
      moneyDrops.push({
        mesh: group,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.12 + impulse.x,
          0.16 + Math.random() * 0.12 + impulse.y,
          (Math.random() - 0.5) * 0.12 + impulse.z,
        ),
        amount,
        life: 240 + Math.floor(Math.random() * 180),
      });
    }

    function collectMoneyDrop(index: number) {
      const drop = moneyDrops[index];
      if (!drop) return;
      money += drop.amount;
      moneyRef.current = money;
      scene.remove(drop.mesh);
      moneyDrops.splice(index, 1);
      setStats((s) => ({ ...s, money }));
      showNotification(
        "money",
        `€${drop.amount}`,
        "Loose cash recovered",
        2200,
      );
    }

    function sendPedestrianAway(
      ped: {
        mesh: THREE.Group;
        targetX: number;
        targetZ: number;
        state: "walking" | "idle" | "fleeing";
        idleTimer: number;
      },
      source: THREE.Vector3,
    ) {
      const away = ped.mesh.position.clone().sub(source);
      away.y = 0;
      if (away.lengthSq() < 0.001) {
        away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      }
      away.normalize();
      ped.targetX = ped.mesh.position.x + away.x * 12;
      ped.targetZ = ped.mesh.position.z + away.z * 12;
      ped.state = "walking";
      ped.idleTimer = 0;
    }

    // Pedestrians mostly keep walking through their own neighborhood instead
    // of teleport-targeting a random street across the whole map — the rule
    // real people follow: stay on the block, occasionally turn a corner.
    function getRandomSidewalkPoint(from?: { x: number; z: number }) {
      let pool = NUERNBERG_STREETS;
      if (from && Math.random() < 0.82) {
        const nearby = NUERNBERG_STREETS.filter((street) => {
          const mx = (street.start.x + street.end.x) / 2;
          const mz = (street.start.z + street.end.z) / 2;
          return Math.hypot(mx - from.x, mz - from.z) < 90;
        });
        if (nearby.length > 0) pool = nearby;
      }
      const road = pool[Math.floor(Math.random() * pool.length)];
      const t = Math.random();
      const side = Math.random() > 0.5 ? 1 : -1;
      const dx = road.end.x - road.start.x;
      const dz = road.end.z - road.start.z;
      const len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len;
      const nz = dx / len;
      const sidewalkOffset = road.width / 2 + 6 + Math.random() * 4;
      return {
        x: road.start.x + dx * t + nx * sidewalkOffset * side,
        z: road.start.z + dz * t + nz * sidewalkOffset * side,
      };
    }

    type ModelZoneRuntime = ModelZoneDefinition & {
      mesh: THREE.Group;
      near: boolean;
    };

    function createModelZone(zone: ModelZoneDefinition): ModelZoneRuntime {
      const group = new THREE.Group();
      group.position.set(zone.position[0], zone.position[1], zone.position[2]);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(5.5, 0.16, 8, 72),
        new THREE.MeshBasicMaterial({
          color: zone.color,
          transparent: true,
          opacity: 0.9,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.18;
      group.add(ring);

      const floor = new THREE.Mesh(
        new THREE.CylinderGeometry(5.5, 5.5, 0.16, 48, 1, true),
        new THREE.MeshBasicMaterial({
          color: zone.color,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      floor.position.y = 0.1;
      group.add(floor);

      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.35, 1),
        new THREE.MeshStandardMaterial({
          color: zone.color,
          emissive: zone.color,
          emissiveIntensity: 0.85,
          roughness: 0.35,
        }),
      );
      core.position.y = 2.2;
      group.add(core);

      const label = makeTextSprite("MODEL " + zone.label, "#eaf6ff");
      label.position.y = 5.8;
      group.add(label);

      const detail = makeTextSprite(
        `T ${zone.temperature.toFixed(1)} · ${compactModelName(zone.model)}`,
        "#9fe8ff",
      );
      detail.position.y = 4.15;
      group.add(detail);

      const light = new THREE.PointLight(zone.color, 1.15, 24);
      light.position.y = 4;
      group.add(light);

      scene.add(group);
      return { ...zone, mesh: group, near: false };
    }

    const modelZones = MODEL_ZONES.map(createModelZone);

    type NcaStationRuntime = {
      mesh: THREE.Group;
      near: boolean;
    };

    function createNcaStation(
      position: [number, number, number],
    ): NcaStationRuntime {
      const group = new THREE.Group();
      group.position.set(position[0], position[1], position[2]);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(4.2, 4.2, 0.25, 40, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0x66ffee,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      base.position.y = 0.12;
      group.add(base);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4.1, 0.18, 8, 64),
        new THREE.MeshBasicMaterial({
          color: 0x66ffee,
          transparent: true,
          opacity: 0.9,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.22;
      group.add(ring);

      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.15, 1),
        new THREE.MeshStandardMaterial({
          color: 0x66ffee,
          emissive: 0x66ffee,
          emissiveIntensity: 1,
          roughness: 0.25,
        }),
      );
      core.position.y = 2;
      group.add(core);

      const label = makeTextSprite("NCA LAB", "#dff7ff");
      label.position.y = 5.4;
      group.add(label);

      const hint = makeTextSprite("press E to wake", "#9fe8ff");
      hint.position.y = 3.7;
      group.add(hint);

      const light = new THREE.PointLight(0x66ffee, 1.2, 26);
      light.position.y = 4;
      group.add(light);

      scene.add(group);
      return { mesh: group, near: false };
    }

    const ncaStations = [createNcaStation([58, 0, 188])];

    function modelZoneIsActive(zone: ModelZoneDefinition) {
      const config = readActiveGameModelConfig();
      const temperature =
        typeof config.temperature === "number" ? config.temperature : 0.2;
      return (
        config.model === zone.model &&
        config.providerName === zone.providerName &&
        Math.abs(temperature - zone.temperature) < 0.01
      );
    }

    function activateModelZone(zone: ModelZoneDefinition) {
      useAppConfig.getState().update((config) => {
        config.modelConfig.model = zone.model;
        config.modelConfig.providerName = zone.providerName;
        config.modelConfig.temperature = zone.temperature;
      });

      try {
        useChatStore.getState().updateCurrentSession((session) => {
          session.mask.modelConfig.model = zone.model;
          session.mask.modelConfig.providerName = zone.providerName;
          session.mask.modelConfig.temperature = zone.temperature;
          session.mask.syncGlobalConfig = false;
        });
      } catch (error) {
        console.warn("game model switch failed:", error);
      }

      const snapshot = makeGameModelSnapshot();
      setWeather(snapshot.weather);
      setModelHud((prev) =>
        sameModelSnapshot(prev, snapshot) ? prev : snapshot,
      );
      showNotification(
        "zone",
        "MODEL " + zone.label,
        `${zone.providerName} · ${zone.subtitle}`,
        3500,
      );
    }

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
    // walk-up-to-talk state — mirrors dbNpcs' `near` flag pattern
    const storyNpcNear = new Set<string>();
    const pedNear = new WeakSet<object>();

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
      targetX: number;
      targetZ: number;
      idleTimer: number;
      state: "walking" | "idle" | "fleeing";
      // residents stay on their block: wander targets stay within r of home
      home?: { x: number; z: number; r: number };
    }
    const pedestrians: Pedestrian[] = [];
    const pickPedTarget = (ped: Pedestrian) => {
      if (ped.home) {
        const a = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * ped.home.r;
        return {
          x: ped.home.x + Math.cos(a) * r,
          z: ped.home.z + Math.sin(a) * r,
        };
      }
      return getRandomSidewalkPoint(ped.mesh.position);
    };
    const pedPersonalities = [
      CHARACTERS.HOMELESS_PETE,
      CHARACTERS.SHOP_OWNER_LEE,
      null,
      null,
      null,
    ];

    const pedestrianCount =
      /Mobi|Android/i.test(navigator.userAgent) ||
      (navigator as any).deviceMemory <= 4
        ? 22
        : 36;
    for (let i = 0; i < pedestrianCount; i++) {
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

      // Spawn on sidewalks
      const spawnPoint = getRandomSidewalkPoint();
      ped.position.set(spawnPoint.x, 0, spawnPoint.z);

      // Initial target
      const targetPoint = getRandomSidewalkPoint();

      scene.add(ped);

      pedestrians.push({
        mesh: ped,
        speed: 0.02 + Math.random() * 0.02, // Slower, more natural
        changeTimer: 100 + Math.random() * 200,
        dead: false,
        personality:
          pedPersonalities[Math.floor(Math.random() * pedPersonalities.length)],
        targetX: targetPoint.x,
        targetZ: targetPoint.z,
        idleTimer: 0,
        state: "walking",
      });
    }

    // === THE NEIGHBORS — your people, home on the spawn block ===
    // Named residents with nameplates who never leave the street. Press E
    // to talk: they run on the same LLM path as every pedestrian, but the
    // prompt knows they know you. An empty spawn can't be home; this one
    // has Eva waiting on it.
    const NEIGHBORS = [
      {
        name: "Eva",
        x: 8,
        z: 192,
        shirt: 0xd45577,
        vibe: "warm, direkt, lacht viel; fragt, wie es dir WIRKLICH geht",
      },
      {
        name: "Oksana",
        x: -9,
        z: 197,
        shirt: 0x55a077,
        vibe: "praktisch, cool, schraubt ständig an den Autos am Bordstein",
      },
      {
        name: "Herr Röttger",
        x: 5,
        z: 214,
        shirt: 0x777799,
        vibe: "Rentner, weiß alles über die Nachbarschaft und die A73",
      },
      {
        name: "MC Lukas",
        x: -6,
        z: 185,
        shirt: 0xcc8833,
        vibe: "Möchtegern-Rapper, loyal, nervig, hat immer einen neuen Track",
      },
    ];
    for (const nb of NEIGHBORS) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 3, 0.8),
        new THREE.MeshLambertMaterial({ color: nb.shirt }),
      );
      body.position.y = 1.5;
      g.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xffdbac }),
      );
      head.position.y = 3.5;
      g.add(head);
      const plate = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createTextTexture(nb.name, "#ffffff", "#1a1a1a", 36),
          transparent: true,
          depthWrite: false,
        }),
      );
      plate.scale.set(Math.max(3, nb.name.length * 0.55), 1.1, 1);
      plate.position.y = 4.6;
      g.add(plate);
      const px = PLAYER_SPAWN.position.x + nb.x;
      const pz = nb.z;
      g.position.set(px, 0, pz);
      scene.add(g);
      pedestrians.push({
        mesh: g,
        speed: 0.012,
        changeTimer: 200,
        dead: false,
        personality: {
          name: nb.name,
          systemPrompt:
            `Du bist ${nb.name}, Nachbar:in am Spawn-Block (Südstadt, ` +
            `Nürnberg). ${nb.vibe}. Ihr kennt euch seit Jahren; der Spieler ` +
            `ist gerade nach Hause gekommen. Antworte kurz (1-3 Sätze), ` +
            `warm, auf Deutsch.`,
        } as (typeof CHARACTERS)[keyof typeof CHARACTERS],
        targetX: px,
        targetZ: pz,
        idleTimer: 120,
        state: "idle",
        home: { x: px, z: pz, r: 14 },
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
    let lastBust = 0;
    let lastCarImpact = 0;

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

      // Region map: M or Escape toggles the full map
      if (e.key === "m" || e.key === "M" || e.key === "Escape") {
        setShowMap((v) => !v);
        if (e.key === "Escape") e.preventDefault();
        return;
      }

      // Handle dialogue options (1, 2, 3 keys)
      if (currentDialogueOptions && ["1", "2", "3"].includes(e.key)) {
        const optionIndex = parseInt(e.key) - 1;
        const opt = currentDialogueOptions[optionIndex];
        if (opt) {
          // Narrow to local variable before calling the action so TypeScript
          // can infer it's defined and callable.
          if (typeof opt.action === "function") {
            opt.action();
          }
          currentDialogueOptions = null;
          return;
        }
      }

      // Surrender to police
      // === SPACE KEY - BRAKE / SURRENDER ===
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        // If dialogue is showing, dismiss it (via ref — state here is stale)
        if (dialogueOpenRef.current) {
          setDialogue(null);
          currentDialogueOptions = null;
          return; // Don't do anything else!
        }

        if (showSurrenderPrompt && wantedLevel > 0) {
          const surrenderedWanted = wantedLevel;
          const fine = Math.min(money, 500 * surrenderedWanted);
          wantedLevel = 0;
          setStats((s) => ({ ...s, wanted: 0 }));
          money -= fine;
          moneyRef.current = money;
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
          const ncaStation = ncaStations.find(
            (station) =>
              playerGroup.position.distanceTo(station.mesh.position) < 6,
          );
          if (ncaStation) {
            wakeNca(15000);
            handleDialogue({
              title: "NCA LAB",
              text: "Living terrain online. Stay close if you want it to keep rendering.",
            });
            setTimeout(() => setDialogue(null), 2500);
            return;
          }

          const enterVehicle = (vehicle: THREE.Group) => {
            activeCar = vehicle;
            playerState = "driving";
            playerGroup.visible = false;
            setOnFoot(false);
          };

          // Try to enter vehicles
          if (playerGroup.position.distanceTo(activeCar.position) < 6) {
            enterVehicle(activeCar);
            return;
          }

          if (
            activeCar !== carGroup &&
            playerGroup.position.distanceTo(carGroup.position) < 6
          ) {
            enterVehicle(carGroup);
            return;
          }

          // Neighborhood cars parked at the spawn curb — yours to take,
          // no wanted level. Everyone on this street knows you.
          for (const parked of parkedCars) {
            if (
              parked !== activeCar &&
              playerGroup.position.distanceTo(parked.position) < 6
            ) {
              enterVehicle(parked);
              return;
            }
          }

          // Steal civilian traffic cars. This removes them from traffic AI and
          // hands the mesh to the player controller.
          const trafficVehicles = trafficRef.current?.getVehicles() ?? [];
          for (const vehicle of trafficVehicles) {
            if (playerGroup.position.distanceTo(vehicle.mesh.position) < 6) {
              const claimed =
                trafficRef.current?.claimVehicle(vehicle.id) ?? vehicle;
              enterVehicle(claimed.mesh);
              wantedLevel = Math.min(wantedLevel + 1, 5);
              showNotification(
                "zone",
                "GRAND THEFT AUTO",
                `${vehicle.type.toUpperCase()} claimed`,
                2500,
              );
              return;
            }
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
                sendPedestrianAway(ped, playerGroup.position);
              } else {
                // Generic response
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
                sendPedestrianAway(ped, playerGroup.position);
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

        // the world is alive — gunfire wounds it (and it will heal)
        woundTerrainAt(end.x, end.z, 4);
        const mid = start.clone().lerp(end, 0.5);
        woundTerrainAt(mid.x, mid.z, 3);

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
              spawnMoneyDrop(
                p.mesh.position.x,
                p.mesh.position.z,
                4 + Math.floor(Math.random() * 12),
                new THREE.Vector3(
                  (Math.random() - 0.5) * 0.15,
                  0.12,
                  (Math.random() - 0.5) * 0.15,
                ),
              );
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
    // once the lesson markers load, aim the waypoint beacon at the first one
    let initialBeaconSet = false;

    // (Removed misplaced building interaction block; this logic should be inside the appropriate event handler)

    // === GAME LOOP ===
    let frame = 0;
    let lastFrameTime = performance.now();

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const deltaTime = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      frame++;
      money = moneyRef.current;

      updateAtmosphere(deltaTime);

      airplanes.forEach((plane) => {
        plane.phase += deltaTime * plane.speed;
        const angle = plane.phase;
        plane.mesh.position.set(
          plane.centerX + Math.cos(angle) * plane.radius,
          plane.altitude + Math.sin(angle * 1.8) * 4,
          plane.centerZ + Math.sin(angle) * plane.radius,
        );
        plane.mesh.rotation.y = -angle + Math.PI / 2;
        plane.mesh.rotation.z = Math.sin(angle * 2.8) * 0.02;
        if (plane.propeller) {
          plane.propeller.rotation.z += deltaTime * 30;
        }
      });

      // label the people once everything exists — no more anonymous city
      if (!labelsDone) {
        labelsDone = true;
        try {
          for (const ped of pedestrians) {
            if (ped.personality?.name)
              ped.mesh.add(
                makeTextSprite("💬 " + ped.personality.name, "#ffd76e"),
              );
          }
          for (const n of storyNPCs) {
            const nm = (n as any).character?.name;
            if (nm) (n as any).mesh.add(makeTextSprite("★ " + nm, "#7dffb1"));
          }
        } catch (err) {
          console.warn("labels failed:", err);
        }
      }

      // real-life rule: walking up to someone starts the conversation
      if (!interiorRef.current?.isInside()) {
        for (const d of dbNpcs) {
          const dist = playerGroup.position.distanceTo(d.mesh.position);
          if (dist < 4.5 && !d.near) {
            d.near = true;
            openDbDialogue(d.npc);
          } else if (dist > 9 && d.near) {
            d.near = false;
          }
          if (dist < 40)
            d.mesh.lookAt(
              playerGroup.position.x,
              d.mesh.position.y,
              playerGroup.position.z,
            );
        }

        // walk up to a mission-giver and it starts — no key needed, just
        // like real life. This is the fix for markers/NPCs that "did
        // nothing" when you walked into them: they only ever listened for E.
        if (playerState !== "driving") {
          for (const npc of storyNPCs) {
            const dist = playerGroup.position.distanceTo(npc.mesh.position);
            if (dist < 4.5 && !storyNpcNear.has(npc.id)) {
              storyNpcNear.add(npc.id);
              void interactWithStoryNPC(npc);
            } else if (dist > 8 && storyNpcNear.has(npc.id)) {
              storyNpcNear.delete(npc.id);
            }
          }

          for (const ped of pedestrians) {
            if (ped.dead || !ped.personality) continue;
            const dist = playerGroup.position.distanceTo(ped.mesh.position);
            if (dist < 3.5 && !pedNear.has(ped)) {
              pedNear.add(ped);
              callLLM(
                ped.personality.name,
                `A stranger approached me on the street. Wanted level: ${wantedLevel}`,
                ped.personality.systemPrompt,
              )
                .then((response) => {
                  handleDialogue({
                    title: ped.personality!.name,
                    text: response,
                  });
                  setTimeout(() => setDialogue(null), 4000);
                })
                .catch(() => {});
            } else if (dist > 7 && pedNear.has(ped)) {
              pedNear.delete(ped);
            }
          }
        }

        const modelActor =
          playerState === "driving" ? activeCar.position : playerGroup.position;
        for (const zone of modelZones) {
          const active = modelZoneIsActive(zone);
          const pulse = active ? 1.08 + Math.sin(now * 0.006) * 0.025 : 1;
          zone.mesh.scale.setScalar(pulse);
          const core = zone.mesh.children[2];
          core.rotation.y += deltaTime * (active ? 1.8 : 0.6);
          core.rotation.x += deltaTime * 0.3;

          const dist = modelActor.distanceTo(zone.mesh.position);
          if (dist < 5.5 && !zone.near) {
            zone.near = true;
            if (!active) activateModelZone(zone);
          } else if (dist > 9) {
            zone.near = false;
          }
        }

        for (const station of ncaStations) {
          const active = ncaActive;
          const pulse = active ? 1.06 + Math.sin(now * 0.01) * 0.03 : 1;
          station.mesh.scale.setScalar(pulse);
          const core = station.mesh.children[2];
          core.rotation.y += deltaTime * (active ? 1.2 : 0.35);
          core.rotation.x += deltaTime * 0.2;

          const dist = modelActor.distanceTo(station.mesh.position);
          if (dist < 6 && !station.near) {
            station.near = true;
            if (!ncaActive) {
              showNotification(
                "zone",
                "NCA LAB",
                "Press E to wake the living terrain",
                3500,
              );
            }
          } else if (dist > 10) {
            station.near = false;
          }
        }
      }

      // The living terrain sleeps unless you explicitly wake it or disturb it.
      if (ncaActive && now > ncaWakeUntil) {
        setNcaActive(false);
      }

      if (ncaActive && frame % NCA_UPLOAD_EVERY === 0) {
        sampleNcaFrame();
      }

      // Audio
      if (wantedLevel > 0 && frame % 60 === 0 && audioCtx && sirenOsc) {
        const now = audioCtx.currentTime;
        sirenOsc.frequency.linearRampToValueAtTime(1200, now + 0.5);
        sirenOsc.frequency.linearRampToValueAtTime(600, now + 1.0);
      }
      toggleSiren(wantedLevel > 0);

      {
        // ride the living hills: the terrain height comes from the NCA
        const rider = playerState === "driving" ? activeCar : playerGroup;
        const floorY = terrainHeightAt(rider.position.x, rider.position.z);
        rider.position.y = Math.max(
          0,
          rider.position.y +
            (floorY - rider.position.y) * Math.min(1, deltaTime * 6),
        );
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
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // Roads
          const drawRoadPath = (
            points: Array<{ x: number; z: number }>,
            stroke: string,
            lineWidth: number,
          ) => {
            if (points.length < 2) return;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            points.forEach((pt, i) => {
              // relative to the player — the map moves under you, as maps do
              const x = (pt.x - pPos.x) * 0.5;
              const y = (pt.z - pPos.z) * 0.5;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          };

          ctx.globalAlpha = 0.85;
          ROADS.forEach((road) => {
            drawRoadPath(
              road.points,
              road.type === "autobahn" ? "#2f2f2f" : "#3f3f3f",
              Math.max(1.2, road.width * 0.22),
            );
          });
          NUERNBERG_STREETS.forEach((street) => {
            drawRoadPath(
              [street.start, street.end],
              street.type === "main" ? "#666666" : "#555555",
              Math.max(1.0, street.width * 0.14),
            );
          });
          ctx.globalAlpha = 1;

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

          // Model switch circles
          modelZones.forEach((zone) => {
            const dx = zone.mesh.position.x - pPos.x;
            const dz = zone.mesh.position.z - pPos.z;
            ctx.strokeStyle = `#${zone.color.toString(16).padStart(6, "0")}`;
            ctx.lineWidth = modelZoneIsActive(zone) ? 3 : 1.5;
            ctx.beginPath();
            ctx.arc(dx * 0.5, dz * 0.5, 4.5, 0, Math.PI * 2);
            ctx.stroke();
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

          // Pedestrians
          pedestrians.forEach((ped) => {
            if (ped.dead) return;
            const dx = ped.mesh.position.x - pPos.x;
            const dz = ped.mesh.position.z - pPos.z;
            ctx.fillStyle = ped.personality ? "#ffd76e" : "#c7b9a2";
            ctx.fillRect(dx * 0.5 - 1, dz * 0.5 - 1, 2, 2);
          });

          // Civilian traffic
          trafficRef.current?.getVehicles().forEach((vehicle) => {
            const dx = vehicle.mesh.position.x - pPos.x;
            const dz = vehicle.mesh.position.z - pPos.z;
            ctx.fillStyle = "#9aa6b2";
            ctx.fillRect(dx * 0.5 - 2, dz * 0.5 - 2, 4, 4);
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
          for (const b of colliders) {
            if (
              Math.abs(nextPos.x - b.position.x) < b.userData.width / 2 + 3 &&
              Math.abs(nextPos.z - b.position.z) < b.userData.depth / 2 + 3
            ) {
              collide = true;
              const impactSpeed = Math.abs(speed);
              speed *= -0.4;
              health -= 1;
              if (now - lastCarImpact > 220) {
                lastCarImpact = now;
                applyVehicleDamage(
                  activeCar,
                  Math.min(0.35, impactSpeed * 0.5),
                );
                spawnImpactSparks(nextPos.x, 1.3, nextPos.z, 7, 0xffaa33);
              }
            }
          }

          if (!collide) {
            const trafficVehicles = trafficRef.current?.getVehicles() ?? [];
            for (const vehicle of trafficVehicles) {
              const dx = nextPos.x - vehicle.mesh.position.x;
              const dz = nextPos.z - vehicle.mesh.position.z;
              const hitRadius = VEHICLE_STATS[vehicle.type].hitRadius;
              if (dx * dx + dz * dz < hitRadius * hitRadius) {
                const pushDir = new THREE.Vector3(dx, 0, dz);
                if (pushDir.lengthSq() < 0.0001) {
                  pushDir.copy(
                    new THREE.Vector3(0, 0, 1).applyQuaternion(
                      activeCar.quaternion,
                    ),
                  );
                }
                pushDir.normalize();
                activeCar.position.add(
                  pushDir.clone().multiplyScalar(hitRadius * 0.45),
                );
                vehicle.mesh.position.add(pushDir.clone().multiplyScalar(-1.2));
                const impactSpeed = Math.abs(speed);
                speed *= -0.35;
                vehicle.speed *= 0.35;
                health -= 1;
                collide = true;
                if (now - lastCarImpact > 220) {
                  lastCarImpact = now;
                  const dmgAmt = Math.min(0.4, impactSpeed * 0.6);
                  applyVehicleDamage(activeCar, dmgAmt);
                  applyVehicleDamage(vehicle.mesh, dmgAmt);
                  vehicle.damage = vehicle.mesh.userData.damage || 0;
                  spawnImpactSparks(
                    vehicle.mesh.position.x,
                    1.3,
                    vehicle.mesh.position.z,
                    9,
                    0xffcc55,
                  );
                }
                spawnMoneyDrop(
                  vehicle.mesh.position.x,
                  vehicle.mesh.position.z,
                  6 + Math.floor(Math.random() * 14),
                  pushDir.clone().multiplyScalar(0.2),
                );
                break;
              }
            }
          }

          if (!collide) activeCar.position.copy(nextPos);
        } else {
          // Walking
          speed = 0;
          const sprinting =
            keys["shift"] && (keys["w"] || keys["a"] || keys["s"] || keys["d"]);
          const walkSpeed = sprinting ? 0.82 : 0.42;
          const turnSpeed = sprinting ? 0.075 : 0.05;
          if (keys["w"]) playerGroup.translateZ(walkSpeed);
          if (keys["s"]) playerGroup.translateZ(-walkSpeed * 0.85);
          if (keys["a"]) playerGroup.rotation.y += turnSpeed;
          if (keys["d"]) playerGroup.rotation.y -= turnSpeed;

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

          const footVehicleMeshes: THREE.Group[] = [
            activeCar,
            ...(trafficRef.current?.getVehicles().map((v) => v.mesh) ?? []),
            ...policeCars
              .filter((pc) => !pc.hijacked && pc.mesh !== activeCar)
              .map((pc) => pc.mesh),
          ];
          footVehicleMeshes.forEach((vehicleMesh) => {
            const dist = playerGroup.position.distanceTo(vehicleMesh.position);
            if (dist < 4.5) {
              const push = playerGroup.position
                .clone()
                .sub(vehicleMesh.position);
              if (push.lengthSq() > 0.0001) {
                push.setY(0).normalize();
                playerGroup.position.add(push.multiplyScalar(0.6));
              }
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

        // Pedestrian AI - improved with target-based movement
        pedestrians.forEach((ped) => {
          if (ped.dead) return;

          const playerPos =
            playerState === "driving"
              ? activeCar.position
              : playerGroup.position;
          const distToPlayer = ped.mesh.position.distanceTo(playerPos);
          const drivingSpeed = playerState === "driving" ? Math.abs(speed) : 0;

          // Step out of the way when the player is on foot and gets close —
          // but named characters hold still and greet you instead (see the
          // walk-up-to-talk block above), otherwise they'd flee mid-dialogue.
          if (
            playerState === "walking" &&
            distToPlayer < 3.5 &&
            !ped.personality
          ) {
            sendPedestrianAway(ped, playerPos);
          }

          // Flee from approaching cars
          if (
            playerState === "driving" &&
            distToPlayer < 18 &&
            drivingSpeed > 0.25 &&
            ped.state !== "fleeing"
          ) {
            ped.state = "fleeing";
            const awayFromCar = ped.mesh.position
              .clone()
              .sub(playerPos)
              .normalize();
            ped.targetX = ped.mesh.position.x + awayFromCar.x * 20;
            ped.targetZ = ped.mesh.position.z + awayFromCar.z * 20;
          }

          // State machine
          if (ped.state === "fleeing") {
            // Run away fast
            const toTarget = new THREE.Vector3(
              ped.targetX - ped.mesh.position.x,
              0,
              ped.targetZ - ped.mesh.position.z,
            );
            if (toTarget.length() < 2 || distToPlayer > 30) {
              ped.state = "walking";
              const newTarget = pickPedTarget(ped);
              ped.targetX = newTarget.x;
              ped.targetZ = newTarget.z;
            } else {
              ped.mesh.lookAt(new THREE.Vector3(ped.targetX, 0, ped.targetZ));
              ped.mesh.translateZ(ped.speed * 3); // Run fast
            }
          } else if (ped.state === "idle") {
            ped.idleTimer--;
            if (ped.idleTimer <= 0) {
              ped.state = "walking";
              const newTarget = pickPedTarget(ped);
              ped.targetX = newTarget.x;
              ped.targetZ = newTarget.z;
            }
          } else {
            // Walking state - move toward target
            const toTarget = new THREE.Vector3(
              ped.targetX - ped.mesh.position.x,
              0,
              ped.targetZ - ped.mesh.position.z,
            );

            if (toTarget.length() < 2) {
              // Reached target - either idle or get new target
              if (Math.random() < 0.3) {
                ped.state = "idle";
                ped.idleTimer = 60 + Math.random() * 120;
              } else {
                const newTarget = pickPedTarget(ped);
                ped.targetX = newTarget.x;
                ped.targetZ = newTarget.z;
              }
            } else {
              ped.mesh.lookAt(new THREE.Vector3(ped.targetX, 0, ped.targetZ));
              ped.mesh.translateZ(ped.speed);
            }
          }

          // Hit by car - require much higher speed, smaller hitbox
          const hitDistance = ped.mesh.position.distanceTo(playerPos);
          const speedThreshold = 0.7; // Much higher - need to be going fast

          if (
            hitDistance < 2.5 && // Smaller hitbox
            drivingSpeed > speedThreshold
          ) {
            // Only count as hit if directly in front of car
            const carForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
              activeCar.quaternion,
            );
            const toPed = ped.mesh.position.clone().sub(playerPos).normalize();
            const dotProduct = carForward.dot(toPed);

            if (dotProduct > 0.5) {
              // Must be in front of car
              health -= 1;
              // Smaller wanted increase, cap at 3 for pedestrian hits
              wantedLevel = Math.min(wantedLevel + 0.5, 3);
              ped.dead = true;
              ped.mesh.rotation.x = -Math.PI / 2;
              ped.mesh.position.y = 0.5;
              spawnMoneyDrop(
                ped.mesh.position.x,
                ped.mesh.position.z,
                8 + Math.floor(Math.random() * 18),
                new THREE.Vector3(
                  (Math.random() - 0.5) * 0.2,
                  0.12,
                  (Math.random() - 0.5) * 0.2,
                ),
              );
              const flyDir = ped.mesh.position
                .clone()
                .sub(playerPos)
                .normalize()
                .multiplyScalar(5);
              ped.mesh.position.add(flyDir);
            }
          } else if (
            hitDistance < 4 &&
            drivingSpeed > 0.2 &&
            drivingSpeed <= speedThreshold
          ) {
            // Pedestrians dodge slow-moving cars
            const awayFromCar = ped.mesh.position
              .clone()
              .sub(playerPos)
              .normalize();
            ped.mesh.position.add(awayFromCar.multiplyScalar(0.5));
          }
        });

        for (let i = moneyDrops.length - 1; i >= 0; i--) {
          const drop = moneyDrops[i];
          drop.life--;
          drop.velocity.y -= 0.014;
          drop.mesh.position.add(drop.velocity);
          drop.mesh.rotation.y += 0.18;
          drop.mesh.rotation.x += 0.06;

          if (drop.mesh.position.y <= 0.45) {
            drop.mesh.position.y = 0.45;
            drop.velocity.y *= -0.35;
            drop.velocity.x *= 0.92;
            drop.velocity.z *= 0.92;
          }

          const collector =
            playerState === "driving"
              ? activeCar.position
              : playerGroup.position;
          if (drop.mesh.position.distanceTo(collector) < 3) {
            collectMoneyDrop(i);
            continue;
          }

          if (drop.life <= 0) {
            scene.remove(drop.mesh);
            moneyDrops.splice(i, 1);
          }
        }

        for (let i = impactSparks.length - 1; i >= 0; i--) {
          const s = impactSparks[i];
          s.life--;
          s.velocity.y -= 0.03;
          s.mesh.position.add(s.velocity);
          s.mesh.scale.multiplyScalar(0.9);
          if (s.life <= 0) {
            scene.remove(s.mesh);
            impactSparks.splice(i, 1);
          }
        }

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
        // pass the camera's ground-plane forward so traffic never pops into
        // existence inside the player's field of view
        camera.getWorldDirection(_trafficViewDir);
        _trafficViewDir.y = 0;
        _trafficViewDir.normalize();
        trafficRef.current?.update(targetPos, _trafficViewDir);

        // Spawn police based on wanted level - much slower spawn rate
        // Max 1 car at 1 star, 2 at 2 stars, etc. - GTA style gradual response
        const maxPolice = Math.min(wantedLevel, 3); // Cap at 3 police cars
        if (
          wantedLevel > 0 &&
          policeCars.filter((pc) => !pc.hijacked).length < maxPolice &&
          frame % 600 === 0 // Much slower spawn (every 10 sec instead of 1.6 sec)
        ) {
          // Spawn police away from player, not on top of them
          const newCop = createPoliceCar();
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnDist = 80 + Math.random() * 40; // 80-120 units away
          newCop.mesh.position.set(
            targetPos.x + Math.cos(spawnAngle) * spawnDist,
            0,
            targetPos.z + Math.sin(spawnAngle) * spawnDist,
          );
          policeCars.push(newCop);
        }

        // Wanted level decay over time when not committing crimes
        if (wantedLevel > 0 && frame % 1800 === 0) {
          // Every 30 seconds
          wantedLevel = Math.max(0, wantedLevel - 0.25); // Slow decay
          if (wantedLevel < 0.5) wantedLevel = 0; // Clear if very low
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

          // close enough + wanted = arrest: fine, respawn, wanted cleared
          if (
            wantedLevel > 0 &&
            distToPlayer < 7 &&
            !pc.hijacked &&
            performance.now() - lastBust > 8000 &&
            !interiorRef.current?.isInside()
          ) {
            lastBust = performance.now();
            wantedLevel = 0;
            money = Math.max(0, money - 150);
            moneyRef.current = money;
            showNotification(
              "location",
              "🚔 BUSTED",
              "Die Polizei hat dich erwischt — 150€ Strafe",
              5000,
            );
            playerState = "walking";
            playerGroup.visible = true;
            setOnFoot(true);
            playerGroup.position.set(
              PLAYER_SPAWN.position.x,
              0,
              PLAYER_SPAWN.position.z,
            );
          }
          if (wantedLevel > 0 && distToPlayer < 250) {
            // Police state machine
            const now = Date.now();

            if (pc.state === "patrol" && wantedLevel > 0) {
              pc.state = "warning";
              pc.warningsIssued = 0;
            }

            if (pc.state === "warning") {
              // Issue warnings before pursuit - longer intervals
              if (now - pc.lastWarningTime > 8000 && pc.warningsIssued < 3) {
                pc.warningsIssued++;
                pc.lastWarningTime = now;

                const warnings = [
                  "This is LSPD! Pull over NOW!",
                  "Final warning! Stop your vehicle!",
                  "Suspect is not complying. All units pursue!",
                ];

                if (distToPlayer < 60) {
                  // Only warn when closer
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

              // Much slower approach during warning phase
              pc.speed = Math.min(pc.speed + 0.005, 0.5);
            }

            if (pc.state === "pursuit") {
              // Pursuit but not overly aggressive
              pc.speed = Math.min(pc.speed + 0.01, 0.9); // Slower max speed
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

        // Mission markers: walking into one actually starts it. Complete it,
        // collect the reward, and the beacon jumps to the next active marker —
        // one legible cause-and-effect loop: beacon → walk in → reward → next.
        if (!initialBeaconSet && markers.length > 0) {
          initialBeaconSet = true;
          const first = markers.find((m) => m.active);
          if (first) {
            setWaypointFnRef.current?.(
              first.mesh.position.x,
              first.mesh.position.z,
            );
          }
        }
        const charPos =
          playerState === "driving" ? activeCar.position : playerGroup.position;
        markers.forEach((m) => {
          if (!m.active) return;
          m.mesh.rotation.y += 0.05;
          const mdx = charPos.x - m.mesh.position.x;
          const mdz = charPos.z - m.mesh.position.z;
          if (mdx * mdx + mdz * mdz < 36) {
            m.active = false;
            scene.remove(m.mesh);
            const lesson = m.lesson;
            const rewardMoney = lesson?.reward?.money ?? 50;
            const xp = lesson?.reward?.xp ?? 25;
            money += rewardMoney;
            moneyRef.current = money;
            handleDialogue({
              title: lesson ? lesson.titleDe : m.name,
              text:
                (lesson ? `${lesson.description}\n\n` : "") +
                `+${xp} XP · +$${rewardMoney}`,
            });
            setTimeout(() => setDialogue(null), 6000);
            const next = markers.find((x) => x.active);
            if (next) {
              setWaypointFnRef.current?.(
                next.mesh.position.x,
                next.mesh.position.z,
              );
              showNotification("zone", "NÄCHSTE MISSION", next.name, 3000);
            }
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

      // === PHYSICS WORLD ===
      // relativity: the game has its own speed of light; approach it and
      // γ grows, the world visibly warps (FOV) — length contraction vibes
      const C_GAME = 2.2; // game-units/frame; autobahn terminal ≈ 1.5
      const v = Math.min(Math.abs(speed), C_GAME * 0.995);
      const gamma = 1 / Math.sqrt(1 - (v * v) / (C_GAME * C_GAME));
      if (cameraMode === "follow") {
        const targetFov = 75 + Math.min(30, (gamma - 1) * 45);
        if (Math.abs(camera.fov - targetFov) > 0.1) {
          camera.fov += (targetFov - camera.fov) * 0.08;
          camera.updateProjectionMatrix();
        }
      }
      // non-locality + wave nature exhibits
      if (physicsWorld.portals) {
        physicsWorld.portals.update(now * 0.001);
        const rider = playerState === "driving" ? activeCar : playerGroup;
        const exit = physicsWorld.portals.check(rider.position);
        if (exit) {
          rider.position.copy(exit);
          if (playerState === "driving") speed *= 0.3; // arrive gently
        }
      }
      if (physicsWorld.doubleSlit) physicsWorld.doubleSlit.update(now * 0.001);

      // region map bookkeeping: live player marker + waypoint arrival
      {
        const rider = playerState === "driving" ? activeCar : playerGroup;
        playerMarkerRef.current.x = rider.position.x;
        playerMarkerRef.current.z = rider.position.z;
        playerMarkerRef.current.heading = rider.rotation.y;
        const wp = waypointRef.current;
        if (wp) {
          waypointBeaconMat.opacity = 0.35 + 0.18 * Math.sin(now / 260);
          const dx = rider.position.x - wp.x;
          const dz = rider.position.z - wp.z;
          if (dx * dx + dz * dz < 625) {
            // arrived (25 units) — the beacon has done its job
            waypointRef.current = null;
            waypointBeacon.visible = false;
          }
        }
      }

      // Update stats
      if (frame % 10 === 0) {
        setStats((s) => ({
          ...s,
          speed: (speed * 100).toFixed(0),
          health,
          wanted: wantedLevel,
          money,
          gamma: Math.round(gamma * 1000) / 1000,
          relationship: missionSystemRef.current?.getMariaAffection() || 50,
        }));
      }

      if (interiorRef.current?.isInside()) {
        interiorRef.current.updateFPVControls(camera, keys);
        renderer.render(scene, camera);
        // NOTE: no requestAnimationFrame here — animate() already schedules
        // itself at the top. A second one doubled the callbacks every frame
        // (exponential) and froze the whole browser after ~1s inside.
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
      clockEl.remove();
      airplanes.forEach((plane) => scene.remove(plane.mesh));
      moneyDrops.forEach((drop) => scene.remove(drop.mesh));
      ncaLifeRef.current?.destroy();
      ncaLifeRef.current = null;
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
            {stats.gamma > 1.02 && (
              <span
                style={{
                  fontSize: "22px",
                  color: stats.gamma > 1.5 ? "#ff66ff" : "#66ddff",
                  textShadow: "0 0 8px currentColor",
                }}
                title="Lorentz factor — you are approaching the game's speed of light"
              >
                γ={stats.gamma.toFixed(2)}
              </span>
            )}
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

          <div
            style={{
              marginTop: "8px",
              width: "250px",
              boxSizing: "border-box",
              background: "rgba(4, 10, 18, 0.66)",
              border: "1px solid rgba(70, 224, 255, 0.35)",
              borderRadius: "6px",
              padding: "7px 9px",
              fontFamily: "monospace",
              textShadow: "none",
              color: "#dff7ff",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#7de7ff",
                letterSpacing: "1px",
              }}
            >
              ACTIVE MODEL
            </div>
            <div
              style={{
                fontSize: "13px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={`${modelHud.providerName} / ${modelHud.model}`}
            >
              {modelHud.providerName} / {compactModelName(modelHud.model)}
            </div>
            <div style={{ fontSize: "12px", color: "#b6c8d4" }}>
              TEMP {modelHud.temperature.toFixed(1)} / WEATHER{" "}
              {modelHud.weather.toUpperCase()}
            </div>
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
            [WASD] MOVE | [M] MAP
          </div>

          {/* Minimap — click it for the full region map */}
          <div
            onClick={() => setShowMap(true)}
            title="Karte öffnen (M)"
            style={{
              marginTop: "20px",
              border: "2px solid white",
              borderRadius: "50%",
              overflow: "hidden",
              width: "200px",
              height: "200px",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            <canvas ref={minimapRef} width={200} height={200} />
          </div>
        </div>
      )}

      {/* REGION MAP — the whole world on one sheet: your city, Fürth,
          Erlangen (MPI), Nürnberg Altstadt, Berlin, autobahns, portals.
          Click anywhere to set a waypoint beacon. */}
      {showMap && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(4,8,4,0.88)",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <canvas
            ref={mapCanvasRef}
            onClick={onMapClick}
            style={{
              width: "min(92vw, 130vh)",
              height: "min(82vh, 92vw)",
              border: "2px solid rgba(255,255,255,0.35)",
              borderRadius: 12,
              cursor: "crosshair",
            }}
          />
          <div
            style={{
              color: "#cfe8cf",
              fontFamily: "monospace",
              fontSize: 13,
              textShadow: "1px 1px 0 #000",
            }}
          >
            click = waypoint beacon · M / ESC = close · Map data © OpenStreetMap
            contributors
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
      {/* {showMissions && gameManagerRef.current?.getProgress() && (
          // <MissionOverview
          //   progress={gameManagerRef.current.getProgress()!}
          //   onClose={() => setShowMissions(false)}
          // />
        )} */}

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

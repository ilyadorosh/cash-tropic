"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { initWorld, MAP_LAYOUT } from "./World";
import { GameStats, Dialogue, DialogueOption } from "./types";
import {
  CHARACTERS,
  THIEF_MISSION_DIALOGUE,
  MARIA_DIALOGUE,
  POLICE_DIALOGUE,
} from "./Characters";
import { AIAgentSystem } from "./AIAgentSystem";
import { PoliceSystem } from "./PoliceSystem";
import { MissionSystem } from "./MissionSystem";
import { ProceduralCity, Building } from "./ProceduralCity";

// === AUDIO UTILITIES ===
const speak = (text: string, pitch = 1, rate = 1) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = pitch;
  u.rate = rate;
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

  // Systems refs (persist across renders)
  const aiSystemRef = useRef<AIAgentSystem | null>(null);
  const policeSystemRef = useRef<PoliceSystem | null>(null);
  const missionSystemRef = useRef<MissionSystem | null>(null);

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

  useEffect(() => {
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

    // === PROCEDURAL CITY ===
    cityRef.current = new ProceduralCity(scene, colliders, interactables);

    // Generate initial buildings for unlocked zones
    cityRef.current.generateZoneBuildings(
      cityRef.current.getZones().find((z) => z.name === "Grove Street")!,
      4,
    );
    cityRef.current.generateZoneBuildings(
      cityRef.current.getZones().find((z) => z.name === "Downtown")!,
      5,
    );
    cityRef.current.generateZoneBuildings(
      cityRef.current.getZones().find((z) => z.name === "El Corona")!,
      3,
    );

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
    carGroup.position.set(0, 0, 80);
    carGroup.rotation.y = Math.PI;
    scene.add(carGroup);

    // === PLAYER ON FOOT ===
    const playerGroup = new THREE.Group();
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

    // === GAME STATE ===
    const keys: { [key: string]: boolean } = {};
    let playerState: "driving" | "walking" = "driving";
    let activeCar = carGroup;
    let speed = 0;
    let steering = 0;
    let health = 100;
    let wantedLevel = 0;
    let money = 500;
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
      if (e.key === " " && showSurrenderPrompt) {
        const nearestCop = policeCars.find(
          (pc) =>
            !pc.hijacked &&
            pc.mesh.position.distanceTo(
              playerState === "driving"
                ? activeCar.position
                : playerGroup.position,
            ) < 20,
        );
        if (nearestCop && policeSystemRef.current) {
          const result = policeSystemRef.current.surrender();
          if (result.success) {
            wantedLevel = 0;
            money = Math.max(0, money - result.penalty.money);
            setStats((s) => ({ ...s, wanted: 0, money }));
            handleDialogue({
              title: "Arrested",
              text: `You paid $${result.penalty.money} in fines. ${
                result.penalty.weapons ? " Weapons confiscated." : ""
              }`,
            });
            setTimeout(() => setDialogue(null), 3000);
          }
        }
        setShowSurrenderPrompt(false);
        return;
      }

      // Skip cutscene dialogue
      if (e.key === " " && cameraMode === "cutscene") {
        cameraMode = "follow";
        setDialogue(null);
        setStats((s) => ({ ...s, isCutscene: false }));
        return;
      }

      // Interact (E key)
      if (e.key.toLowerCase() === "e" && cameraMode === "follow") {
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
                const lines = [
                  "Watch it!",
                  "Nice day, huh?",
                  "You lost?",
                  "I'm busy. ",
                ];
                handleDialogue({
                  title: "Stranger",
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
          const altar = interactables.find((i) => i.type === "altar");
          if (altar && playerGroup.position.distanceTo(altar.pos) < 6) {
            if (thiefFollowing) {
              // Complete thief mission
              missionSystemRef.current?.thiefReachedChurch();
              thiefFollowing = false;
              const thiefNPC = storyNPCs.find((n) => n.id === "THE_THIEF");
              if (thiefNPC) {
                thiefNPC.followingPlayer = false;
                thiefNPC.mesh.position.set(-120, 0, 20); // Stay at church
              }
            } else if (wantedLevel > 0) {
              wantedLevel = 0;
              handleDialogue({
                title: "Sanctuary",
                text: "Your sins are forgiven.  The police will not pursue you here.",
              });
              speak("Your sins are forgiven", 0.8, 0.9);
              setStats((s) => ({ ...s, wanted: 0 }));
            } else {
              const prayers = [
                "You feel a sense of peace wash over you.",
                "The weight of your choices feels lighter.",
                "A voice whispers: 'There is always a path back. '",
              ];
              handleDialogue({
                title: "Altar",
                text: prayers[Math.floor(Math.random() * prayers.length)],
              });
            }
            setTimeout(() => setDialogue(null), 3000);
            return;
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
      // if (nearbyBuilding) {
      //   const response = await callLLM(
      //     'SHOPKEEPER',
      //     `Player entered ${nearbyBuilding.name}.  ${nearbyBuilding.description}`,
      //     `You are a shopkeeper at ${nearbyBuilding.name}.  Greet the customer briefly in character with the business type. Be colorful and memorable. One or two sentences max.`
      //   );
      //   handleDialogue({
      //     title: nearbyBuilding.name,
      //     text: response
      //   });
      //   setTimeout(() => setDialogue(null), 4000);
      //   return;
      // }
    }

    // === GAME LOOP ===
    let frame = 0;

    function animate() {
      requestAnimationFrame(animate);
      frame++;

      // Audio
      if (wantedLevel > 0 && frame % 60 === 0 && audioCtx && sirenOsc) {
        const now = audioCtx.currentTime;
        sirenOsc.frequency.linearRampToValueAtTime(1200, now + 0.5);
        sirenOsc.frequency.linearRampToValueAtTime(600, now + 1.0);
      }
      toggleSiren(wantedLevel > 0);

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

          // Show zone notification
          const currentZone = cityRef.current.getPlayerZone(pPos.x, pPos.z);
          if (currentZone && currentZone.name !== lastZoneName) {
            lastZoneName = currentZone.name;
            handleDialogue({
              title: "📍 " + currentZone.name,
              text: `You've entered ${currentZone.name}`,
            });
            setTimeout(() => setDialogue(null), 2000);
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
      if (mountElement) mountElement.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDialogue, handleReward]);

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
      <div ref={mountRef} />

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
    </div>
  );
}

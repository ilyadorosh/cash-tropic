"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type {
  GameMap,
  Building,
  NPC,
  Mission,
  PlayerState,
  PlayerTrace,
  Position,
} from "./types";
import MobileControls from "./MobileControls";
import MissionOverview from "./MissionOverviewClean";
import {
  createPlayer as createNcaPlayer,
  fetchWeights as fetchNcaWeights,
  type Player as NcaPlayer,
} from "@/app/nca/player/engine";

// Generate a simple player ID based on timestamp and random
function generatePlayerId(): string {
  const stored = localStorage.getItem("game:playerId");
  if (stored) return stored;
  const newId = `player-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  localStorage.setItem("game:playerId", newId);
  return newId;
}

export default function GameEngine() {
  const gameRef = useRef<any>(null);
  const Phaser = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  // BLØB — the living one: a real neural cellular automaton, in-game
  const ncaBossRef = useRef<NcaPlayer | null>(null);
  // the living city: an NCA as the terrain of the whole map
  const ncaTerrainRef = useRef<NcaPlayer | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showMissions, setShowMissions] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentDialogue, setCurrentDialogue] = useState<{
    npcName: string;
    text: string;
  } | null>(null);

  // Game data refs
  const mapDataRef = useRef<GameMap | null>(null);
  const buildingsRef = useRef<Building[]>([]);
  const npcsRef = useRef<NPC[]>([]);
  const tracesRef = useRef<PlayerTrace[]>([]);
  const playerIdRef = useRef<string>("");
  const lastTraceTimeRef = useRef<number>(0);

  // Load all game data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoadingProgress(10);
        playerIdRef.current = generatePlayerId();

        // Load all data in parallel
        const [
          mapRes,
          buildingsRes,
          npcsRes,
          missionsRes,
          tracesRes,
          playerRes,
        ] = await Promise.all([
          fetch("/api/game/map"),
          fetch("/api/game/buildings"),
          fetch("/api/game/npcs"),
          fetch("/api/game/missions"),
          fetch("/api/game/traces"),
          fetch(`/api/game/player/${playerIdRef.current}`),
        ]);

        setLoadingProgress(50);

        mapDataRef.current = await mapRes.json();
        buildingsRef.current = await buildingsRes.json();
        npcsRef.current = await npcsRes.json();
        const missionsData = await missionsRes.json();
        setMissions(missionsData);
        tracesRef.current = await tracesRes.json();
        const playerData = await playerRes.json();
        setPlayerState(playerData);

        setLoadingProgress(80);

        // Initialize Phaser
        initPhaser();
      } catch (error) {
        console.error("Error loading game data:", error);
        // Initialize with defaults on error
        initPhaser();
      }
    };

    loadGameData();

    return () => {
      ncaBossRef.current?.destroy();
      ncaBossRef.current = null;
      ncaTerrainRef.current?.destroy();
      ncaTerrainRef.current = null;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const saveTrace = useCallback(async (x: number, y: number) => {
    const now = Date.now();
    // Save every 5 seconds
    if (now - lastTraceTimeRef.current < 5000) return;
    lastTraceTimeRef.current = now;

    try {
      await fetch("/api/game/traces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: playerIdRef.current,
          point: { x, y },
        }),
      });
    } catch (error) {
      console.error("Error saving trace:", error);
    }
  }, []);

  const savePlayerState = useCallback(async (state: Partial<PlayerState>) => {
    try {
      await fetch(`/api/game/player/${playerIdRef.current}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
    } catch (error) {
      console.error("Error saving player state:", error);
    }
  }, []);

  const initPhaser = useCallback(async () => {
    const phaserModule = await import("phaser");
    Phaser.current = phaserModule.default;

    const mapData = mapDataRef.current || {
      width: 2000,
      height: 2000,
      spawnPosition: { x: 1000, y: 1000 },
      zones: [],
      roads: [],
    };

    const config: any = {
      type: Phaser.current.AUTO,
      parent: "game-container",
      width: window.innerWidth,
      height: window.innerHeight,
      scale: {
        mode: Phaser.current.Scale.RESIZE,
        autoCenter: Phaser.current.Scale.CENTER_BOTH,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    function preload(this: any) {
      setLoadingProgress(90);

      // Create simple colored rectangles as sprites
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      // Player sprite (green circle)
      graphics.fillStyle(0x76b900);
      graphics.fillCircle(16, 16, 16);
      graphics.generateTexture("player", 32, 32);
      graphics.clear();

      // NPC sprite (yellow circle)
      graphics.fillStyle(0xf6e05e);
      graphics.fillCircle(12, 12, 12);
      graphics.generateTexture("npc", 24, 24);
      graphics.clear();

      // Tree sprite (green triangle)
      graphics.fillStyle(0x2d5a27);
      graphics.fillTriangle(16, 0, 0, 32, 32, 32);
      graphics.generateTexture("tree", 32, 32);
      graphics.clear();
    }

    function create(this: any) {
      sceneRef.current = this;
      const scene = this;

      // Set world bounds
      this.physics.world.setBounds(0, 0, mapData.width, mapData.height);

      // Draw background (grass)
      const bg = this.add.rectangle(
        mapData.width / 2,
        mapData.height / 2,
        mapData.width,
        mapData.height,
        0x1a472a,
      );
      bg.setDepth(-30);

      // Draw zones
      mapData.zones?.forEach((zone: any) => {
        const width = zone.bounds.maxX - zone.bounds.minX;
        const height = zone.bounds.maxY - zone.bounds.minY;
        const centerX = zone.bounds.minX + width / 2;
        const centerY = zone.bounds.minY + height / 2;

        const zoneRect = this.add.rectangle(
          centerX,
          centerY,
          width,
          height,
          parseInt(zone.color.replace("#", ""), 16),
          0.3,
        );
        zoneRect.setStrokeStyle(2, parseInt(zone.color.replace("#", ""), 16));

        // Zone label
        this.add
          .text(centerX, zone.bounds.minY + 20, zone.name, {
            fontSize: "14px",
            fill: zone.color,
            fontStyle: "bold",
          })
          .setOrigin(0.5);
      });

      // Draw roads
      const roadGraphics = this.add.graphics();
      mapData.roads?.forEach((road: any) => {
        const color =
          road.type === "autobahn"
            ? 0x4a5568
            : road.type === "hauptstrasse"
              ? 0x718096
              : 0xa0aec0;

        roadGraphics.lineStyle(road.width, color, 1);
        roadGraphics.beginPath();
        roadGraphics.moveTo(road.points[0].x, road.points[0].y);
        for (let i = 1; i < road.points.length; i++) {
          roadGraphics.lineTo(road.points[i].x, road.points[i].y);
        }
        roadGraphics.strokePath();

        // Road markings for autobahn
        if (road.type === "autobahn") {
          roadGraphics.lineStyle(4, 0xffffff, 0.5);
          roadGraphics.beginPath();
          roadGraphics.moveTo(road.points[0].x, road.points[0].y);
          for (let i = 1; i < road.points.length; i++) {
            roadGraphics.lineTo(road.points[i].x, road.points[i].y);
          }
          roadGraphics.strokePath();
        }
      });

      // Draw buildings
      const buildingGroup = this.physics.add.staticGroup();
      buildingsRef.current.forEach((building: Building) => {
        const color = building.color
          ? parseInt(building.color.replace("#", ""), 16)
          : 0x4a5568;

        const rect = this.add.rectangle(
          building.position.x,
          building.position.y,
          building.width,
          building.height,
          color,
        );
        rect.setStrokeStyle(2, 0x2d3748);
        buildingGroup.add(rect);

        // Building label
        this.add
          .text(
            building.position.x,
            building.position.y - building.height / 2 - 10,
            building.name,
            {
              fontSize: "10px",
              fill: "#ffffff",
              backgroundColor: "#00000088",
              padding: { x: 4, y: 2 },
            },
          )
          .setOrigin(0.5);

        rect.setData("buildingId", building.id);
        rect.setData("buildingName", building.name);
      });

      // Draw NPCs
      const npcGroup = this.physics.add.group();
      npcsRef.current.forEach((npc: NPC) => {
        const color = npc.color
          ? parseInt(npc.color.replace("#", ""), 16)
          : 0xf6e05e;

        const npcSprite = this.add.circle(
          npc.position.x,
          npc.position.y,
          15,
          color,
        );
        this.physics.add.existing(npcSprite, false);
        npcSprite.body.setImmovable(true);
        npcGroup.add(npcSprite);

        // NPC name label
        this.add
          .text(npc.position.x, npc.position.y - 25, npc.name, {
            fontSize: "11px",
            fill: "#ffffff",
            backgroundColor: "#00000088",
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5);

        npcSprite.setData("npcId", npc.id);
        npcSprite.setData("npcName", npc.name);
        npcSprite.setData("npcDialogues", npc.dialogues);

        // Pulse animation for NPCs
        this.tweens.add({
          targets: npcSprite,
          scale: 1.1,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        });
      });

      // Draw player traces (ghost paths)
      const traceGraphics = this.add.graphics();
      traceGraphics.lineStyle(2, 0x667eea, 0.3);
      tracesRef.current.forEach((trace: PlayerTrace) => {
        if (trace.points.length < 2) return;
        traceGraphics.beginPath();
        traceGraphics.moveTo(trace.points[0].x, trace.points[0].y);
        for (let i = 1; i < trace.points.length; i++) {
          traceGraphics.lineTo(trace.points[i].x, trace.points[i].y);
        }
        traceGraphics.strokePath();
      });

      // Create player - spawn at safe position (not on buildings)
      const spawnPos = mapData.spawnPosition || { x: 1000, y: 1000 };
      const player = this.add.circle(spawnPos.x, spawnPos.y, 16, 0x76b900);
      this.physics.add.existing(player);
      player.body.setCollideWorldBounds(true);
      player.body.setDrag(200);
      player.body.setMaxVelocity(300);

      // Player direction indicator
      const playerDir = this.add.triangle(
        spawnPos.x + 20,
        spawnPos.y,
        0,
        10,
        0,
        -10,
        15,
        0,
        0x48bb78,
      );

      // ── THE LIVING CITY: the ground itself is a neural cellular automaton ──
      // One big NCA grid stretched across the whole map. The same trained
      // local rule, just on a larger world (NCAs are translation-invariant).
      // Walking wounds the tissue; it heals behind you. The AI is the room.
      {
        const TGS = 128; // terrain grid size (cells)
        const terrainCanvas = document.createElement("canvas");
        fetchNcaWeights()
          .then((weights) => {
            if (!weights || !sceneRef.current) return;
            const terra = createNcaPlayer(
              terrainCanvas,
              () => {},
              () => {},
              { preserveDrawingBuffer: true },
            );
            if (!terra) return;
            const meta = terra.loadModel(weights, {
              gridSize: TGS,
              seeds: 20,
              canvasScale: 2,
              background: "#1a472a", // dead cells blend into the grass
            });
            if (!meta) return;
            ncaTerrainRef.current = terra;
            terra.params.speed = 1;
            terra.params.stepEvery = 2; // MX250-friendly
            terra.setPlaying(true);

            const mirror = document.createElement("canvas");
            mirror.width = terrainCanvas.width;
            mirror.height = terrainCanvas.height;
            const mctx = mirror.getContext("2d");
            if (!mctx) return;
            mctx.drawImage(terrainCanvas, 0, 0);

            const tex = scene.textures.addCanvas("nca-terrain", mirror);
            const img = scene.add
              .image(mapData.width / 2, mapData.height / 2, "nca-terrain")
              .setDisplaySize(mapData.width, mapData.height)
              .setAlpha(0.92)
              .setDepth(-20);
            img.setInteractive();
            img.on("pointerdown", (pointer: any) => {
              terra.damageAtCell(
                (pointer.worldX / mapData.width) * TGS,
                (pointer.worldY / mapData.height) * TGS,
                6,
              );
            });
            scene.ncaTerrain = {
              nca: terra,
              tex,
              ctx: mctx,
              src: terrainCanvas,
              gs: TGS,
            };
          })
          .catch((e) => console.warn("living terrain failed:", e));
      }

      // ── BLØB: a live neural cellular automaton as an in-world creature ──
      // Its sprite IS the NCA's GPU canvas, refreshed every frame.
      // Poke it: real damage to the substrate — and it regrows. In-browser
      // neural net as a game character.
      {
        const bx = spawnPos.x + 240;
        const by = spawnPos.y - 150;
        const ncaCanvas = document.createElement("canvas");
        fetchNcaWeights()
          .then((weights) => {
            if (!weights || !sceneRef.current) return;
            const nca = createNcaPlayer(
              ncaCanvas,
              () => {},
              () => {},
              { preserveDrawingBuffer: true },
            );
            if (!nca) return;
            const meta = nca.loadModel(weights);
            if (!meta) return;
            ncaBossRef.current = nca;
            nca.params.speed = 2;
            nca.setPlaying(true);

            // Phaser canvas textures need a 2D canvas; the NCA renders in
            // WebGL2, so mirror it into a 2D canvas every frame
            const mirror = document.createElement("canvas");
            mirror.width = ncaCanvas.width;
            mirror.height = ncaCanvas.height;
            const mirrorCtx = mirror.getContext("2d");
            if (!mirrorCtx) return;
            mirrorCtx.drawImage(ncaCanvas, 0, 0);

            const tex = scene.textures.addCanvas("bloeb-nca", mirror);
            scene.ncaSrc = ncaCanvas;
            scene.ncaMirrorCtx = mirrorCtx;
            const spr = scene.add
              .image(bx, by, "bloeb-nca")
              .setDisplaySize(120, 120)
              .setDepth(5);
            spr.setInteractive({ useHandCursor: true });
            spr.on("pointerdown", () => {
              nca.damageCenter();
              scene.cameras.main.shake(130, 0.004);
            });
            scene.ncaTex = tex;
            scene.ncaSpr = spr;
            scene.add
              .text(bx, by - 78, "BLØB — the living one", {
                fontSize: "13px",
                fontFamily: "monospace",
                color: "#76b900",
              })
              .setOrigin(0.5)
              .setDepth(5);
            scene.add
              .text(bx, by + 74, "poke it · it heals", {
                fontSize: "10px",
                fontFamily: "monospace",
                color: "#9ba798",
              })
              .setOrigin(0.5)
              .setDepth(5);
          })
          .catch((e) => console.warn("BLØB failed to spawn:", e));
      }

      // Camera follows player
      this.cameras.main.startFollow(player);
      this.cameras.main.setZoom(1);
      this.cameras.main.setBounds(0, 0, mapData.width, mapData.height);

      // Collision with buildings
      this.physics.add.collider(player, buildingGroup);

      // Overlap with NPCs for interaction
      this.physics.add.overlap(player, npcGroup, (p: any, npc: any) => {
        const dialogues = npc.getData("npcDialogues");
        if (dialogues && dialogues.length > 0 && scene.interactKeyPressed) {
          const npcName = npc.getData("npcName");
          setCurrentDialogue({
            npcName,
            text: dialogues[0].text,
          });
          scene.interactKeyPressed = false;
        }
      });

      // Store references
      scene.player = player;
      scene.playerDir = playerDir;
      scene.keys = this.input.keyboard.addKeys({
        up: Phaser.current.Input.Keyboard.KeyCodes.W,
        down: Phaser.current.Input.Keyboard.KeyCodes.S,
        left: Phaser.current.Input.Keyboard.KeyCodes.A,
        right: Phaser.current.Input.Keyboard.KeyCodes.D,
        arrowUp: Phaser.current.Input.Keyboard.KeyCodes.UP,
        arrowDown: Phaser.current.Input.Keyboard.KeyCodes.DOWN,
        arrowLeft: Phaser.current.Input.Keyboard.KeyCodes.LEFT,
        arrowRight: Phaser.current.Input.Keyboard.KeyCodes.RIGHT,
        interact: Phaser.current.Input.Keyboard.KeyCodes.E,
        mission: Phaser.current.Input.Keyboard.KeyCodes.M,
        brake: Phaser.current.Input.Keyboard.KeyCodes.SPACE,
      });

      scene.mobileInput = { x: 0, y: 0 };
      scene.interactKeyPressed = false;

      // Key event handlers
      this.input.keyboard.on("keydown-E", () => {
        scene.interactKeyPressed = true;
      });

      this.input.keyboard.on("keydown-M", () => {
        setShowMissions((prev) => !prev);
      });

      // SPACE key - brake/surrender (reduce wanted level)
      this.input.keyboard.on("keydown-SPACE", () => {
        // Brake - stop immediately
        player.body.setVelocity(0, 0);
        // Visual feedback
        const flash = scene.add.circle(player.x, player.y, 30, 0xffffff, 0.5);
        scene.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 2,
          duration: 300,
          onComplete: () => flash.destroy(),
        });
      });

      setLoading(false);
      setLoadingProgress(100);
    }

    function update(this: any) {
      const scene = this;
      if (!scene.player) return;

      // BLØB lives: pull the latest NCA frame into the sprite texture
      if (scene.ncaTex && scene.ncaMirrorCtx && scene.ncaSrc) {
        scene.ncaMirrorCtx.drawImage(scene.ncaSrc, 0, 0);
        scene.ncaTex.refresh();
      }
      if (scene.ncaTerrain) {
        scene.ncaTerrain.ctx.drawImage(scene.ncaTerrain.src, 0, 0);
        scene.ncaTerrain.tex.refresh();
      }

      const speed = 250;
      let vx = 0;
      let vy = 0;

      // Keyboard input
      if (scene.keys.left.isDown || scene.keys.arrowLeft.isDown) vx = -speed;
      if (scene.keys.right.isDown || scene.keys.arrowRight.isDown) vx = speed;
      if (scene.keys.up.isDown || scene.keys.arrowUp.isDown) vy = -speed;
      if (scene.keys.down.isDown || scene.keys.arrowDown.isDown) vy = speed;

      // Mobile input override
      if (scene.mobileInput.x !== 0 || scene.mobileInput.y !== 0) {
        vx = scene.mobileInput.x * speed;
        vy = scene.mobileInput.y * speed;
      }

      // you move through living tissue — it parts, then heals behind you
      if (
        scene.ncaTerrain &&
        (vx !== 0 || vy !== 0) &&
        Date.now() - (scene.ncaWoundAt || 0) > 200
      ) {
        scene.ncaWoundAt = Date.now();
        scene.ncaTerrain.nca.damageAtCell(
          (scene.player.x / mapData.width) * scene.ncaTerrain.gs,
          (scene.player.y / mapData.height) * scene.ncaTerrain.gs,
          2.5,
        );
      }

      scene.player.body.setVelocity(vx, vy);

      // Update direction indicator
      if (vx !== 0 || vy !== 0) {
        const angle = Math.atan2(vy, vx);
        scene.playerDir.setPosition(
          scene.player.x + Math.cos(angle) * 25,
          scene.player.y + Math.sin(angle) * 25,
        );
        scene.playerDir.setRotation(angle);

        // Save trace
        saveTrace(scene.player.x, scene.player.y);
      }
    }

    gameRef.current = new Phaser.current.Game(config);
  }, [saveTrace]);

  // Handle mobile controls
  const handleMobileMove = useCallback(
    (direction: { x: number; y: number }) => {
      if (sceneRef.current) {
        sceneRef.current.mobileInput = direction;
      }
    },
    [],
  );

  const handleMobileAction = useCallback(
    (action: "interact" | "brake" | "mission" | "attack") => {
      if (!sceneRef.current) return;

      switch (action) {
        case "interact":
          sceneRef.current.interactKeyPressed = true;
          break;
        case "mission":
          setShowMissions((prev) => !prev);
          break;
        case "brake":
          if (sceneRef.current.player) {
            sceneRef.current.player.body.setVelocity(0, 0);
          }
          break;
      }
    },
    [],
  );

  const handleSelectMission = useCallback(
    (missionId: string) => {
      setPlayerState((prev) =>
        prev ? { ...prev, currentMissionId: missionId } : null,
      );
      savePlayerState({ currentMissionId: missionId });
      setShowMissions(false);
    },
    [savePlayerState],
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* Loading Screen */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            zIndex: 1000,
          }}
        >
          <h1
            style={{
              color: "#76b900",
              fontSize: "32px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            Grand Thermodynamische Autobahn
          </h1>
          <p
            style={{
              color: "#888",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            Nürnberg Edition
          </p>
          <div
            style={{
              width: "300px",
              height: "8px",
              backgroundColor: "#333",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${loadingProgress}%`,
                height: "100%",
                backgroundColor: "#76b900",
                transition: "width 0.3s",
              }}
            />
          </div>
          <p style={{ color: "#666", marginTop: "10px" }}>
            {loadingProgress < 50
              ? "Loading game data..."
              : loadingProgress < 90
                ? "Initializing engine..."
                : "Starting game..."}
          </p>
        </div>
      )}

      {/* Game Container */}
      <div id="game-container" style={{ width: "100%", height: "100%" }} />

      {/* HUD */}
      {!loading && playerState && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "10px 15px",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px",
            zIndex: 100,
          }}
        >
          <div>❤️ {playerState.health}</div>
          <div>💰 €{playerState.money}</div>
          <div>⭐ {playerState.xp} XP</div>
          {playerState.wantedLevel > 0 && (
            <div style={{ color: "#fc8181" }}>
              🚔 {"⭐".repeat(playerState.wantedLevel)}
            </div>
          )}
        </div>
      )}

      {/* Controls hint */}
      {!loading && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "8px 12px",
            borderRadius: "8px",
            color: "#888",
            fontSize: "12px",
            zIndex: 100,
          }}
        >
          WASD/Arrows: Move | E: Interact | M: Missions | SPACE: Brake
        </div>
      )}

      {/* NPC Dialogue */}
      {currentDialogue && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            padding: "20px",
            borderRadius: "12px",
            border: "2px solid #667eea",
            color: "#fff",
            maxWidth: "500px",
            zIndex: 200,
          }}
          onClick={() => setCurrentDialogue(null)}
        >
          <div
            style={{
              color: "#f6e05e",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            {currentDialogue.npcName}
          </div>
          <p style={{ margin: 0 }}>{currentDialogue.text}</p>
          <p
            style={{
              margin: "10px 0 0",
              color: "#666",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            Click to close
          </p>
        </div>
      )}

      {/* Mobile Controls */}
      <MobileControls onMove={handleMobileMove} onAction={handleMobileAction} />

      {/* Mission Overview */}
      {showMissions && (
        <MissionOverview
          missions={missions}
          onClose={() => setShowMissions(false)}
          onSelectMission={handleSelectMission}
          currentMissionId={playerState?.currentMissionId}
        />
      )}
    </div>
  );
}

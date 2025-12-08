// InteriorSystem.ts - First-person interiors with Redis data display

import * as THREE from "three";

export interface InteriorData {
  buildingId: string;
  type: "shop" | "office" | "home" | "club" | "church";
  displays: DisplayScreen[];
  items: InteriorItem[];
}

export interface DisplayScreen {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  width: number;
  height: number;
  content: "redis_stats" | "leaderboard" | "news" | "prices" | "custom";
  dataKey?: string; // Redis key to display
}

export interface InteriorItem {
  type: "counter" | "shelf" | "chair" | "table" | "tv" | "computer";
  position: { x: number; y: number; z: number };
}

export class InteriorSystem {
  private scene: THREE.Scene;
  private currentInterior: THREE.Group | null = null;
  private isInInterior: boolean = false;
  private exteriorPosition: THREE.Vector3 = new THREE.Vector3();
  private screens: Map<string, THREE.Mesh> = new Map();

  // Redis data cache
  private redisCache: Map<string, any> = new Map();
  private upstashUrl: string;
  private upstashToken: string;

  constructor(scene: THREE.Scene, upstashUrl: string, upstashToken: string) {
    this.scene = scene;
    this.upstashUrl = upstashUrl;
    this.upstashToken = upstashToken;
  }

  async enterBuilding(
    buildingId: string,
    buildingType: string,
    playerGroup: THREE.Group,
    camera: THREE.PerspectiveCamera,
  ): Promise<boolean> {
    if (this.isInInterior) return false;

    // Save exterior position
    this.exteriorPosition.copy(playerGroup.position);

    // Create interior
    this.currentInterior = this.createInterior(buildingType);
    this.scene.add(this.currentInterior);

    // Move player to interior space (far away from exterior)
    playerGroup.position.set(1000, 1, 1000); // Interior is at 1000, 1000

    // Switch to first-person view
    camera.position.set(1000, 2, 1005);
    camera.lookAt(1000, 2, 990);

    this.isInInterior = true;

    // Load Redis data for screens
    await this.loadRedisDataForScreens(buildingId);

    return true;
  }

  exitBuilding(playerGroup: THREE.Group, camera: THREE.PerspectiveCamera) {
    if (!this.isInInterior) return;

    // Remove interior
    if (this.currentInterior) {
      this.scene.remove(this.currentInterior);
      this.currentInterior = null;
    }

    // Restore player position
    playerGroup.position.copy(this.exteriorPosition);
    playerGroup.position.z += 5; // Step back from door

    this.isInInterior = false;
    this.screens.clear();
  }

  private createInterior(type: string): THREE.Group {
    const interior = new THREE.Group();
    interior.position.set(1000, 0, 1000); // Far from exterior world

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    interior.add(floor);

    // Walls
    const wallMat = new THREE.MeshLambertMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
    });

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMat);
    backWall.position.set(0, 4, -10);
    interior.add(backWall);

    // Side walls
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-10, 4, 0);
    interior.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(10, 4, 0);
    interior.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshLambertMaterial({ color: 0xeeeeee }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
    interior.add(ceiling);

    // Interior light
    const light = new THREE.PointLight(0xffffff, 1, 30);
    light.position.set(0, 7, 0);
    interior.add(light);

    // Type-specific furniture and screens
    switch (type) {
      case "shop":
        this.addShopInterior(interior);
        break;
      case "office":
        this.addOfficeInterior(interior);
        break;
      case "church":
        this.addChurchInterior(interior);
        break;
      default:
        this.addShopInterior(interior);
    }

    return interior;
  }

  private addShopInterior(interior: THREE.Group) {
    // Counter
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1.2, 1.5),
      new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    );
    counter.position.set(0, 0.6, -6);
    interior.add(counter);

    // Shelves on walls
    for (let i = 0; i < 3; i++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.2, 1),
        new THREE.MeshLambertMaterial({ color: 0x654321 }),
      );
      shelf.position.set(-7, 2 + i * 1.5, 0);
      interior.add(shelf);
    }

    // Display screen (shows Redis data)
    const screen = this.createDisplayScreen(3, 2, "redis_stats");
    screen.position.set(0, 4, -9.9);
    interior.add(screen);
    this.screens.set("main_display", screen);
  }

  private addOfficeInterior(interior: THREE.Group) {
    // Desk
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.8, 2),
      new THREE.MeshLambertMaterial({ color: 0x5c4033 }),
    );
    desk.position.set(0, 0.4, -5);
    interior.add(desk);

    // Computer monitor on desk
    const monitor = this.createDisplayScreen(1.5, 1, "leaderboard");
    monitor.position.set(0, 1.5, -5.5);
    monitor.rotation.x = -0.2;
    interior.add(monitor);
    this.screens.set("computer", monitor);

    // Wall display
    const wallScreen = this.createDisplayScreen(4, 2.5, "redis_stats");
    wallScreen.position.set(0, 4, -9.9);
    interior.add(wallScreen);
    this.screens.set("wall_display", wallScreen);
  }

  private addChurchInterior(interior: THREE.Group) {
    // Pews
    for (let row = 0; row < 4; row++) {
      const pew = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.8, 1),
        new THREE.MeshLambertMaterial({ color: 0x5c4033 }),
      );
      pew.position.set(0, 0.4, 2 + row * 2);
      interior.add(pew);
    }

    // Altar
    const altar = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.2, 1.5),
      new THREE.MeshLambertMaterial({ color: 0xffd700 }),
    );
    altar.position.set(0, 0.6, -7);
    interior.add(altar);

    // Stained glass effect (colored light)
    const stainedLight = new THREE.PointLight(0xff6600, 0.5, 20);
    stainedLight.position.set(5, 5, 0);
    interior.add(stainedLight);
  }

  private createDisplayScreen(
    width: number,
    height: number,
    contentType: string,
  ): THREE.Mesh {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Default loading state
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#0f0";
    ctx.font = "24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("LOADING...", 256, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      material,
    );

    mesh.userData = { canvas, ctx, texture, contentType };

    return mesh;
  }

  private async loadRedisDataForScreens(buildingId: string) {
    // Set loading timeout - don't block forever
    const timeout = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Loading timeout')), 3000)
    );

    try {
      // Use YOUR API route with timeout
      const fetchWithTimeout = async (url: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return res;
        } catch {
          clearTimeout(timeoutId);
          return null;
        }
      };

      const [statsRes, leaderboardRes] = await Promise.all([
        fetchWithTimeout("/api/game?key=game:stats"),
        fetchWithTimeout("/api/game/leaderboard?subject=physics"),
      ]);

      if (statsRes) {
        const stats = await statsRes.json().catch(() => ({}));
        this.redisCache.set("game_stats", stats.result || {});
      }
      if (leaderboardRes) {
        const leaderboard = await leaderboardRes.json().catch(() => ({}));
        this.redisCache.set("leaderboard", leaderboard.leaderboard || []);
      }

      this.updateScreens();
    } catch (e) {
      console.warn("Failed to load game data (using defaults):", e);
      // Set defaults so screens still render
      this.redisCache.set("game_stats", { totalBuildings: 0, playersOnline: 1 });
      this.redisCache.set("leaderboard", []);
      this.updateScreens();
    }
  }

  private updateScreens() {
    this.screens.forEach((screen, id) => {
      const { canvas, ctx, texture, contentType } = screen.userData;

      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, 512, 256);

      switch (contentType) {
        case "redis_stats":
          this.drawRedisStats(ctx);
          break;
        case "leaderboard":
          this.drawLeaderboard(ctx);
          break;
      }

      texture.needsUpdate = true;
    });
  }

  private drawRedisStats(ctx: CanvasRenderingContext2D) {
    const stats = this.redisCache.get("city_stats") || {};

    ctx.fillStyle = "#0f0";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("📊 CITY STATS", 256, 40);

    ctx.font = "20px monospace";
    ctx.textAlign = "left";

    const lines = [
      `🏢 Gebäude: ${stats.totalBuildings || 0}`,
      `👥 Spieler Online: ${stats.playersOnline || 1}`,
      `💰 Wirtschaft: ${stats.economy || "€0"}`,
      `📈 Wachstum: ${stats.growth || "0%"}`,
      `🎓 Lektionen: ${stats.lessonsCompleted || 0}`,
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, 30, 80 + i * 35);
    });
  }

  private drawLeaderboard(ctx: CanvasRenderingContext2D) {
    const leaderboard = this.redisCache.get("leaderboard:physics") || [];

    ctx.fillStyle = "#ff0";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("🏆 PHYSIK RANGLISTE", 256, 35);

    ctx.font = "18px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";

    const top5 = Array.isArray(leaderboard) ? leaderboard.slice(0, 5) : [];
    top5.forEach((entry: any, i: number) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
      ctx.fillText(
        `${medal} ${entry.name || "Anonym"}: ${entry.score || 0} XP`,
        30,
        70 + i * 35,
      );
    });

    if (top5.length === 0) {
      ctx.fillText("Noch keine Einträge... ", 30, 100);
    }
  }

  isInside(): boolean {
    return this.isInInterior;
  }

  // First-person controls when inside
  updateFPVControls(
    camera: THREE.PerspectiveCamera,
    keys: Record<string, boolean>,
  ) {
    if (!this.isInInterior) return;

    const moveSpeed = 0.15;
    const lookSpeed = 0.03;

    // WASD movement
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (keys["w"]) camera.position.add(forward.multiplyScalar(moveSpeed));
    if (keys["s"]) camera.position.add(forward.multiplyScalar(-moveSpeed));
    if (keys["a"]) camera.position.add(right.multiplyScalar(-moveSpeed));
    if (keys["d"]) camera.position.add(right.multiplyScalar(moveSpeed));

    // Arrow keys to look around
    if (keys["arrowleft"]) camera.rotation.y += lookSpeed;
    if (keys["arrowright"]) camera.rotation.y -= lookSpeed;

    // Keep within interior bounds
    const interiorCenter = new THREE.Vector3(1000, 0, 1000);
    const maxDist = 9;
    const distFromCenter = camera.position.distanceTo(
      new THREE.Vector3(1000, camera.position.y, 1000),
    );
    if (distFromCenter > maxDist) {
      const dir = camera.position.clone().sub(interiorCenter).normalize();
      camera.position.set(
        1000 + dir.x * maxDist,
        camera.position.y,
        1000 + dir.z * maxDist,
      );
    }
  }
}

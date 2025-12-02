// ProceduralCity.ts - LLM-powered procedural city generation

import * as THREE from "three";

export interface Building {
  id: string;
  type: "business" | "house" | "landmark" | "entertainment";
  name: string;
  description: string;
  signs: SignData[];
  position: { x: number; z: number };
  size: { w: number; h: number; d: number };
  color: number;
  interiorType?: string;
  unlockRequirement?: {
    type: "money" | "respect" | "relationship" | "mission";
    value: number | string;
  };
  generated: boolean;
}

export interface SignData {
  text: string;
  position: "front" | "side" | "roof" | "window";
  color: string;
  bgColor: string;
  fontSize?: number;
}

export interface CityZone {
  name: string;
  centerX: number;
  centerZ: number;
  radius: number;
  theme:
    | "residential"
    | "downtown"
    | "industrial"
    | "beach"
    | "slums"
    | "hills";
  unlocked: boolean;
  buildings: Building[];
}

const LLM_ENDPOINT =
  process.env.NEXT_PUBLIC_LLM_ENDPOINT || "/api/characterThink";

// Generate text texture for signs
export function createTextTexture(
  text: string,
  color: string = "#ffffff",
  bgColor: string = "#000000",
  fontSize: number = 40,
  width: number = 512,
  height: number = 128,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Text
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Word wrap for long text
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      if (ctx.measureText(testLine).width < width - 40) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize * 1.2;
    const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + i * lineHeight);
    });
  }

  return new THREE.CanvasTexture(canvas);
}

// Create neon sign effect
export function createNeonSign(
  text: string,
  color: string,
  width: number = 4,
  height: number = 1,
): THREE.Group {
  const group = new THREE.Group();

  // Glowing background
  const glowGeo = new THREE.PlaneGeometry(width + 0.5, height + 0.3);
  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.z = -0.05;
  group.add(glow);

  // Sign face
  const signGeo = new THREE.PlaneGeometry(width, height);
  const texture = createTextTexture(text, color, "#111111", 36, 256, 64);
  const signMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  group.add(sign);

  return group;
}

export class ProceduralCity {
  private scene: THREE.Scene;
  private colliders: THREE.Mesh[];
  private interactables: any[];
  private zones: CityZone[] = [];
  private allBuildings: Map<string, { mesh: THREE.Group; data: Building }> =
    new Map();
  private generationQueue: Array<{
    zone: CityZone;
    slot: { x: number; z: number };
  }> = [];
  private isGenerating: boolean = false;

  // Player progress tracking
  private playerMoney: number = 500;
  private playerRespect: number = 0;
  private playerRelationship: number = 50;
  private completedMissions: Set<string> = new Set();

  private maxBuildingsPerZone: number = 6;
  private maxTotalBuildings: number = 25;
  private generationCooldown: number = 30000; // 30 seconds between generation attempts
  private lastGenerationAttempt: number = 0;
  private hasInitialized: boolean = false;

  initializeStartingBuildings() {
    if (this.hasInitialized) return; // Prevent double init
    this.hasInitialized = true;

    console.log("Initializing starting buildings (fallback only).. .");

    // Generate a few buildings per unlocked zone using FALLBACK ONLY (no LLM)
    this.zones.forEach((zone) => {
      if (!zone || !zone.unlocked) return;

      const slots = this.getAvailableSlots(zone, 3); // Just 3 per zone
      slots.forEach((slot) => {
        const building = this.generateFallbackBuilding(zone, slot.x, slot.z);
        this.addBuilding(building, zone);
      });
    });

    console.log(`Created ${this.allBuildings.size} starting buildings`);
  }

  constructor(
    scene: THREE.Scene,
    colliders: THREE.Mesh[],
    interactables: any[],
  ) {
    this.scene = scene;
    this.colliders = colliders;
    this.interactables = interactables;
    this.initializeZones();
  }

  private initializeZones() {
    this.zones = [
      {
        name: "Südstadt",
        centerX: 0,
        centerZ: 40,
        radius: 80,
        theme: "slums",
        unlocked: true,
        buildings: [],
      },
      {
        name: "Innenstadt",
        centerX: 0,
        centerZ: -120,
        radius: 100,
        theme: "downtown",
        unlocked: true,
        buildings: [],
      },
      {
        name: "Erlenstegen",
        centerX: 200,
        centerZ: 0,
        radius: 120,
        theme: "hills",
        unlocked: false, // Unlocks with relationship
        buildings: [],
      },
      {
        name: "Industriegebiet Hafen",
        centerX: -200,
        centerZ: -100,
        radius: 100,
        theme: "industrial",
        unlocked: false, // Unlocks with missions
        buildings: [],
      },
      {
        name: "Wöhrder See",
        centerX: 200,
        centerZ: -200,
        radius: 150,
        theme: "beach",
        unlocked: false, // Unlocks with Maria relationship
        buildings: [],
      },
      {
        name: "Gostenhof",
        centerX: -150,
        centerZ: 100,
        radius: 80,
        theme: "residential",
        unlocked: true,
        buildings: [],
      },
    ];
  }

  // Call LLM to generate a building

  private async generateBuildingFromLLM(
    zone: CityZone,
    slotX: number,
    slotZ: number,
  ): Promise<Building | null> {
    const themePrompts: Record<string, string> = {
      slums:
        "ein heruntergekommenes aber buntes Geschäft in einem armen Viertel von Nürnberg.  Döner-Läden, Spätkaufs, Wettbüros, Shisha-Bars, Handyshops, türkische Bäckereien.  Namen sollen authentisch deutsch-türkisch oder deutsch klingen.",
      downtown:
        "ein modernes urbanes Geschäft in der Nürnberger Innenstadt. Anwaltskanzleien, Boutiquen, schicke Restaurants, Clubs, Kunstgalerien.  Namen sollen trendy oder geschäftsmäßig klingen.",
      hills:
        "ein Luxus-Etablissement in einem wohlhabenden Viertel.  Designer-Boutiquen, Weinbars, Privatpraxen, Premium-Autohäuser. Namen sollen vornehm und teuer klingen.",
      industrial:
        "ein Industrie- oder Arbeiter-Geschäft.  Lagerhäuser, Speditionen, Metallbau, billige Imbisse, Autowerkstätten. Namen sollen praktisch und direkt sein.",
      beach:
        "ein Geschäft am See oder Naherholungsgebiet. Biergärten, Eisdielen, Bootsverleih, Fahrradläden. Namen sollen entspannt und freundlich klingen.",
      residential:
        "ein Nachbarschaftsgeschäft.  Bäckereien, Metzgereien, Waschsalons, Friseursalons, Tante-Emma-Läden. Namen sollen lokal und familiengeführt klingen.",
    };

    const prompt = `Generiere ein fiktives deutsches Geschäft für ein GTA-ähnliches Spiel das in Nürnberg spielt. 
Thema: ${themePrompts[zone.theme]}
Stadtteil: ${zone.name}

Antworte NUR mit gültigem JSON in diesem exakten Format:
{
  "name": "Geschäftsname auf Deutsch",
  "type": "business",
  "description": "Ein Satz Beschreibung auf Deutsch",
  "mainSign": "HAUPTSCHILD TEXT",
  "windowSign": "Schaufenstertext oder Slogan",
  "color": "hex Farbe wie #ff5500",
  "vibe": "ein Wort Stimmung"
}`;

    try {
      const res = await fetch(LLM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: "CITY_GENERATOR",
          context: prompt,
          systemPrompt:
            "You are a creative game designer. Generate unique, memorable fictional businesses.  Always respond with valid JSON only, no other text.",
        }),
      });

      const data = await res.json();
      let parsed;

      try {
        // Try to extract JSON from response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found");
        }
      } catch (e) {
        console.error("Failed to parse LLM response:", data.response);
        return this.generateFallbackBuilding(zone, slotX, slotZ);
      }

      // Convert color string to number
      let colorNum = 0x666666;
      if (parsed.color && parsed.color.startsWith("#")) {
        colorNum = parseInt(parsed.color.slice(1), 16);
      }

      const building: Building = {
        id: `bld_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "business",
        name: parsed.name || "Unknown Business",
        description: parsed.description || "",
        signs: [
          {
            text: parsed.mainSign || parsed.name,
            position: "front",
            color: "#ffffff",
            bgColor: parsed.color || "#333333",
          },
        ],
        position: { x: slotX, z: slotZ },
        size: {
          w: 15 + Math.random() * 20,
          h: 12 + Math.random() * 15,
          d: 15 + Math.random() * 15,
        },
        color: colorNum,
        generated: true,
      };

      // Add window sign if provided
      if (parsed.windowSign) {
        building.signs.push({
          text: parsed.windowSign,
          position: "window",
          color: "#ffff00",
          bgColor: "#000000",
          fontSize: 24,
        });
      }

      return building;
    } catch (error) {
      console.error("LLM generation failed:", error);
      return this.generateFallbackBuilding(zone, slotX, slotZ);
    }
  }

  // Fallback when LLM fails
  private generateFallbackBuilding(
    zone: CityZone,
    x: number,
    z: number,
  ): Building {
    const fallbacks: Record<
      string,
      Array<{ name: string; sign: string; color: number }>
    > = {
      slums: [
        { name: "Öncü Döner", sign: "DÖNER 4,50€", color: 0xff6600 },
        { name: "Metin's Spätkauf", sign: "24h OFFEN", color: 0x0066ff },
        { name: "Glückspilz Wettbüro", sign: "SPORTWETTEN", color: 0x00aa00 },
        { name: "Goldankauf Blitz", sign: "GOLD ANKAUF", color: 0xffcc00 },
        { name: "Shisha Palace", sign: "SHISHA BAR", color: 0x9900cc },
        { name: "Handy Doktor", sign: "REPARATUR", color: 0x00ccff },
      ],
      downtown: [
        { name: "Sparkasse Filiale", sign: "SPARKASSE", color: 0xff0000 },
        { name: "Zum Goldenen Hirsch", sign: "FINE DINING", color: 0xffffcc },
        { name: "TechHub Nürnberg", sign: "COWORKING", color: 0x00ccff },
        { name: "Modehaus Schuster", sign: "MODE", color: 0xff69b4 },
      ],
      hills: [
        { name: "Château Weinbar", sign: "ERLESENE WEINE", color: 0x990033 },
        { name: "Dr. Schön Ästhetik", sign: "SCHÖNHEIT", color: 0xffcccc },
        { name: "Autohaus Prestige", sign: "PREMIUM AUTOS", color: 0x333333 },
      ],
      industrial: [
        { name: "Müller Spedition", sign: "TRANSPORT", color: 0x666666 },
        { name: "Metallbau Huber", sign: "STAHLBAU", color: 0x999999 },
        { name: "Imbiss zur Werkhalle", sign: "SCHNITZEL 6€", color: 0xcc6600 },
      ],
      beach: [
        { name: "Seestüberl", sign: "BIERGARTEN", color: 0x00aa66 },
        { name: "Eiscafé Venezia", sign: "GELATO", color: 0xff99cc },
        { name: "Bootsverleih Fischer", sign: "TRETBOOTE", color: 0x0099cc },
      ],
      residential: [
        { name: "Bäckerei Schmitt", sign: "FRISCHE BRÖTCHEN", color: 0xcc9966 },
        { name: "Metzgerei Hofer", sign: "WURST & FLEISCH", color: 0xcc0000 },
        { name: "Waschsalon Sauber", sign: "WASCHEN 3€", color: 0x66ccff },
        { name: "Friseur Locke", sign: "HAARE SCHNEIDEN", color: 0xff66cc },
      ],
    };

    const options = fallbacks[zone.theme] || fallbacks.residential;
    const choice = options[Math.floor(Math.random() * options.length)];

    return {
      id: `bld_fallback_${Date.now()}`,
      type: "business",
      name: choice.name,
      description: "Ein lokales Geschäft",
      signs: [
        {
          text: choice.sign,
          position: "front",
          color: "#ffffff",
          bgColor: "#222222",
        },
      ],
      position: { x, z },
      size: { w: 18, h: 14, d: 16 },
      color: choice.color,
      generated: false,
    };
  }

  // Create 3D mesh from building data
  private createBuildingMesh(building: Building): THREE.Group {
    const group = new THREE.Group();
    const { w, h, d } = building.size;

    // Main structure
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const bodyMat = new THREE.MeshLambertMaterial({ color: building.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Add signs
    building.signs.forEach((sign) => {
      const signMesh = this.createSignMesh(sign, w, h, d);
      group.add(signMesh);
    });

    // Add windows (procedural)
    this.addWindows(group, w, h, d, building.color);

    // Add door
    const doorGeo = new THREE.BoxGeometry(2.5, 4, 0.2);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 2, d / 2 + 0.1);
    group.add(door);

    // Add awning for some buildings
    if (Math.random() > 0.5) {
      const awningGeo = new THREE.BoxGeometry(w * 0.6, 0.3, 3);
      const awningMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.4),
      });
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(0, 4.5, d / 2 + 1.5);
      awning.rotation.x = -0.2;
      group.add(awning);
    }

    group.position.set(building.position.x, 0, building.position.z);

    return group;
  }

  private createSignMesh(
    sign: SignData,
    w: number,
    h: number,
    d: number,
  ): THREE.Group {
    const signGroup = new THREE.Group();

    switch (sign.position) {
      case "front":
        // Main sign above door
        const frontSign = createNeonSign(sign.text, sign.color, w * 0.8, 2);
        frontSign.position.set(0, h - 1, d / 2 + 0.2);
        signGroup.add(frontSign);
        break;

      case "roof":
        // Rooftop sign
        const roofSign = createNeonSign(sign.text, sign.color, w * 0.6, 3);
        roofSign.position.set(0, h + 2, 0);
        signGroup.add(roofSign);
        break;

      case "window":
        // Window decal
        const windowSign = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 1.5),
          new THREE.MeshBasicMaterial({
            map: createTextTexture(
              sign.text,
              sign.color,
              "transparent",
              28,
              256,
              96,
            ),
            transparent: true,
            side: THREE.DoubleSide,
          }),
        );
        windowSign.position.set(w * 0.25, 3, d / 2 + 0.15);
        signGroup.add(windowSign);
        break;

      case "side":
        // Side wall sign
        const sideSign = createNeonSign(sign.text, sign.color, 6, 2);
        sideSign.position.set(w / 2 + 0.2, h * 0.6, 0);
        sideSign.rotation.y = Math.PI / 2;
        signGroup.add(sideSign);
        break;
    }

    return signGroup;
  }

  private addWindows(
    group: THREE.Group,
    w: number,
    h: number,
    d: number,
    buildingColor: number,
  ) {
    const windowMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7,
    });
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    const floors = Math.floor(h / 4);
    const windowsPerFloor = Math.floor(w / 5);

    for (let floor = 1; floor < floors; floor++) {
      for (let i = 0; i < windowsPerFloor; i++) {
        const xOffset = (i - (windowsPerFloor - 1) / 2) * 4;
        const yOffset = floor * 4;

        // Window glass
        const windowGeo = new THREE.PlaneGeometry(2, 2.5);
        const windowMesh = new THREE.Mesh(windowGeo, windowMat);
        windowMesh.position.set(xOffset, yOffset, d / 2 + 0.1);
        group.add(windowMesh);

        // Random lit windows at night (emissive)
        if (Math.random() > 0.6) {
          const litMat = new THREE.MeshBasicMaterial({
            color: 0xffee88,
            transparent: true,
            opacity: 0.9,
          });
          const litWindow = new THREE.Mesh(windowGeo, litMat);
          litWindow.position.set(xOffset, yOffset, d / 2 + 0.05);
          group.add(litWindow);
        }
      }
    }
  }

  // Update progress and unlock zones
  updateProgress(
    money: number,
    respect: number,
    relationship: number,
    missions: Set<string>,
  ) {
    this.playerMoney = money;
    this.playerRespect = respect;
    this.playerRelationship = relationship;
    this.completedMissions = missions;

    // Check zone unlocks
    this.zones.forEach((zone) => {
      if (zone.unlocked) return;

      switch (zone.name) {
        case "Vinewood":
          if (respect >= 30 || money >= 10000) {
            zone.unlocked = true;
            this.onZoneUnlocked(zone);
          }
          break;
        case "Industrial District":
          if (missions.has("meet_og_loc") && missions.has("the_confession")) {
            zone.unlocked = true;
            this.onZoneUnlocked(zone);
          }
          break;
        case "Santa Maria Beach":
          if (relationship >= 70) {
            zone.unlocked = true;
            this.onZoneUnlocked(zone);
          }
          break;
      }
    });
  }

  private onZoneUnlocked(zone: CityZone) {
    console.log(`🔓 Zone unlocked: ${zone.name}`);
    // Generate initial buildings for newly unlocked zone
    this.generateZoneBuildings(zone, 5);
  }

  // Generate buildings for a zone
  // Remove or simplify generateZoneBuildings to not use LLM:
  async generateZoneBuildings(zone: CityZone | undefined, count: number) {
    if (!zone || !zone.unlocked) return;
    if (zone.buildings.length >= this.maxBuildingsPerZone) return;

    const actualCount = Math.min(
      count,
      this.maxBuildingsPerZone - zone.buildings.length,
    );
    const slots = this.getAvailableSlots(zone, actualCount);

    // Use FALLBACK only - no LLM calls!
    slots.forEach((slot) => {
      const building = this.generateFallbackBuilding(zone, slot.x, slot.z);
      this.addBuilding(building, zone);
    });
  }

  // In getAvailableSlots or wherever you generate building positions:

  private getAvailableSlots(
    zone: CityZone,
    count: number,
  ): Array<{ x: number; z: number }> {
    const slots: Array<{ x: number; z: number }> = [];
    const gridSize = 35;
    const attempts = count * 10;

    // Player spawn point - keep this area clear!
    const playerSpawn = { x: 0, z: 80 }; // Where player car starts
    const spawnExclusionRadius = 40; // No buildings within 40 units of spawn

    for (let i = 0; i < attempts && slots.length < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * (zone.radius - 30);
      const x = zone.centerX + Math.cos(angle) * dist;
      const z = zone.centerZ + Math.sin(angle) * dist;

      // Snap to grid
      const gridX = Math.round(x / gridSize) * gridSize;
      const gridZ = Math.round(z / gridSize) * gridSize;

      // Check if too close to player spawn
      const distToSpawn = Math.sqrt(
        Math.pow(gridX - playerSpawn.x, 2) + Math.pow(gridZ - playerSpawn.z, 2),
      );
      if (distToSpawn < spawnExclusionRadius) {
        continue; // Skip this slot
      }

      // Check if slot is occupied by existing building
      const occupied = Array.from(this.allBuildings.values()).some((b) => {
        const dx = Math.abs(b.data.position.x - gridX);
        const dz = Math.abs(b.data.position.z - gridZ);
        return dx < 30 && dz < 30;
      });

      if (!occupied) {
        slots.push({ x: gridX, z: gridZ });
      }
    }

    return slots;
  }

  private async processGenerationQueue() {
    if (this.isGenerating || this.generationQueue.length === 0) return;

    this.isGenerating = true;

    while (this.generationQueue.length > 0) {
      const item = this.generationQueue.shift()!;

      const building = await this.generateBuildingFromLLM(
        item.zone,
        item.slot.x,
        item.slot.z,
      );

      if (building) {
        this.addBuilding(building, item.zone);
      }

      // Small delay to not overwhelm the LLM
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.isGenerating = false;
  }

  private addBuilding(building: Building, zone: CityZone) {
    const mesh = this.createBuildingMesh(building);
    this.scene.add(mesh);

    zone.buildings.push(building);
    this.allBuildings.set(building.id, { mesh, data: building });

    // Add collider
    const collider = new THREE.Mesh(
      new THREE.BoxGeometry(building.size.w, building.size.h, building.size.d),
    );
    collider.position.set(
      building.position.x,
      building.size.h / 2,
      building.position.z,
    );
    collider.visible = false;
    collider.userData = {
      width: building.size.w,
      depth: building.size.d,
      buildingId: building.id,
    };
    this.colliders.push(collider);

    // Add as interactable
    this.interactables.push({
      type: "building",
      id: building.id,
      name: building.name,
      pos: new THREE.Vector3(
        building.position.x,
        0,
        building.position.z + building.size.d / 2 + 2,
      ),
    });
  }

  // Generate buildings near player as they explore
  // This is now MUCH more conservative
  async generateNearPlayer(playerX: number, playerZ: number) {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastGenerationAttempt < this.generationCooldown) {
      return; // Too soon, skip
    }

    // Check total building limit
    if (this.allBuildings.size >= this.maxTotalBuildings) {
      return; // Enough buildings already
    }

    // Check if already generating
    if (this.isGenerating || this.generationQueue.length > 0) {
      return; // Already busy
    }

    // Find the zone player is in
    const currentZone = this.getPlayerZone(playerX, playerZ);
    if (!currentZone || !currentZone.unlocked) {
      return; // Not in a valid zone
    }

    // Only generate if this zone needs buildings
    if (currentZone.buildings.length >= this.maxBuildingsPerZone) {
      return; // Zone is full
    }

    this.lastGenerationAttempt = now;

    // Generate just ONE building (using fallback to save tokens)
    const slots = this.getAvailableSlots(currentZone, 1);
    if (slots.length > 0) {
      console.log(`Generating 1 building in ${currentZone.name}`);
      const building = this.generateFallbackBuilding(
        currentZone,
        slots[0].x,
        slots[0].z,
      );
      this.addBuilding(building, currentZone);
    }
  }

  // Get building at position (for interaction)
  getBuildingAt(x: number, z: number, radius: number = 10): Building | null {
    for (const [id, { data }] of this.allBuildings) {
      const dx = Math.abs(data.position.x - x);
      const dz = Math.abs(data.position.z - z);
      if (dx < data.size.w / 2 + radius && dz < data.size.d / 2 + radius) {
        return data;
      }
    }
    return null;
  }

  // Get zone player is in
  getPlayerZone(x: number, z: number): CityZone | null {
    for (const zone of this.zones) {
      const dist = Math.sqrt(
        Math.pow(x - zone.centerX, 2) + Math.pow(z - zone.centerZ, 2),
      );
      if (dist < zone.radius) {
        return zone;
      }
    }
    return null;
  }

  getZones(): CityZone[] {
    return this.zones;
  }

  getAllBuildings(): Building[] {
    return Array.from(this.allBuildings.values()).map((b) => b.data);
  }
}

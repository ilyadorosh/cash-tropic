// engines/MapLoader.ts - Map configuration loading from Redis or local

import {
  IMapLoader,
  MapConfig,
  MapType,
  ZoneConfig,
  RoadConfig,
} from "./types";

/**
 * Built-in map configurations
 */
const BUILT_IN_MAPS: Record<string, MapConfig> = {
  nuernberg: {
    id: "nuernberg",
    name: "Nürnberg, Deutschland",
    locale: "de-DE",
    bounds: {
      minX: -500,
      maxX: 500,
      minZ: -500,
      maxZ: 500,
    },
    spawnPoints: [
      {
        id: "player_start",
        type: "player",
        position: { x: 0, y: 0, z: 80 },
        rotation: Math.PI,
        default: true,
      },
      {
        id: "car_start",
        type: "vehicle",
        position: { x: 0, y: 0, z: 80 },
        rotation: Math.PI,
        default: true,
      },
    ],
    zones: [
      {
        id: "suedstadt",
        name: "Südstadt",
        centerX: 0,
        centerZ: 40,
        radius: 80,
        theme: "slums",
        unlocked: true,
      },
      {
        id: "innenstadt",
        name: "Innenstadt",
        centerX: 0,
        centerZ: -120,
        radius: 100,
        theme: "downtown",
        unlocked: true,
      },
      {
        id: "erlenstegen",
        name: "Erlenstegen",
        centerX: 200,
        centerZ: 0,
        radius: 120,
        theme: "hills",
        unlocked: false,
        unlockRequirement: { type: "relationship", value: 70 },
      },
      {
        id: "industriegebiet",
        name: "Industriegebiet Hafen",
        centerX: -200,
        centerZ: -100,
        radius: 100,
        theme: "industrial",
        unlocked: false,
        unlockRequirement: { type: "mission", value: "the_confession" },
      },
      {
        id: "woehrder_see",
        name: "Wöhrder See",
        centerX: 200,
        centerZ: -200,
        radius: 150,
        theme: "beach",
        unlocked: false,
        unlockRequirement: { type: "relationship", value: 80 },
      },
      {
        id: "gostenhof",
        name: "Gostenhof",
        centerX: -150,
        centerZ: 100,
        radius: 80,
        theme: "residential",
        unlocked: true,
      },
    ],
    roads: [
      {
        id: "a3",
        name: "A3",
        type: "autobahn",
        width: 30,
        lanes: 6,
        speedLimit: 999,
        points: [
          { x: -300, z: -250 },
          { x: 300, z: -250 },
        ],
      },
      {
        id: "a73",
        name: "A73",
        type: "autobahn",
        width: 25,
        lanes: 4,
        speedLimit: 999,
        points: [
          { x: 250, z: -300 },
          { x: 250, z: 300 },
        ],
      },
      {
        id: "koenigstor",
        name: "Königstraße",
        type: "hauptstrasse",
        width: 15,
        lanes: 2,
        speedLimit: 50,
        points: [
          { x: -100, z: -150 },
          { x: 100, z: -150 },
        ],
      },
    ],
    landmarks: [
      {
        id: "lorenzkirche",
        name: "St. Lorenzkirche",
        type: "church",
        position: { x: -120, y: 0, z: 50 },
        interactable: true,
        description: "Eine historische gotische Kirche im Herzen von Nürnberg.",
      },
      {
        id: "hauptbahnhof",
        name: "Hauptbahnhof",
        type: "business",
        position: { x: 0, y: 0, z: -200 },
        interactable: true,
        description: "Der zentrale Bahnhof von Nürnberg.",
      },
    ],
  },

  gta_sa: {
    id: "gta_sa",
    name: "Los Santos, San Andreas",
    locale: "en-US",
    bounds: {
      minX: -1000,
      maxX: 1000,
      minZ: -1000,
      maxZ: 1000,
    },
    spawnPoints: [
      {
        id: "grove_street",
        type: "player",
        position: { x: 0, y: 0, z: 10 },
        rotation: 0,
        default: true,
      },
    ],
    zones: [
      {
        id: "grove_street",
        name: "Grove Street",
        centerX: 0,
        centerZ: 40,
        radius: 100,
        theme: "residential",
        unlocked: true,
      },
      {
        id: "downtown_ls",
        name: "Downtown Los Santos",
        centerX: 0,
        centerZ: -200,
        radius: 150,
        theme: "downtown",
        unlocked: true,
      },
      {
        id: "vinewood",
        name: "Vinewood",
        centerX: 300,
        centerZ: 100,
        radius: 120,
        theme: "hills",
        unlocked: false,
        unlockRequirement: { type: "respect", value: 30 },
      },
      {
        id: "santa_maria_beach",
        name: "Santa Maria Beach",
        centerX: -300,
        centerZ: 0,
        radius: 150,
        theme: "beach",
        unlocked: false,
        unlockRequirement: { type: "relationship", value: 70 },
      },
      {
        id: "el_corona",
        name: "El Corona",
        centerX: -150,
        centerZ: -100,
        radius: 80,
        theme: "slums",
        unlocked: true,
      },
      {
        id: "industrial",
        name: "Industrial District",
        centerX: 200,
        centerZ: -300,
        radius: 100,
        theme: "industrial",
        unlocked: false,
        unlockRequirement: { type: "mission", value: "meet_og_loc" },
      },
    ],
    roads: [
      {
        id: "grove_main",
        name: "Grove Street",
        type: "strasse",
        width: 12,
        lanes: 2,
        speedLimit: 30,
        points: [
          { x: -50, z: 0 },
          { x: 50, z: 0 },
        ],
      },
    ],
    landmarks: [
      {
        id: "cj_house",
        name: "CJ's House",
        type: "safehouse",
        position: { x: 0, y: 0, z: 20 },
        interactable: true,
        description: "Home. At least it was before I f***ed everything up.",
      },
    ],
  },

  gta_vc: {
    id: "gta_vc",
    name: "Vice City",
    locale: "en-US",
    bounds: {
      minX: -800,
      maxX: 800,
      minZ: -800,
      maxZ: 800,
    },
    spawnPoints: [
      {
        id: "ocean_beach",
        type: "player",
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        default: true,
      },
    ],
    zones: [
      {
        id: "ocean_beach",
        name: "Ocean Beach",
        centerX: 0,
        centerZ: 0,
        radius: 150,
        theme: "beach",
        unlocked: true,
      },
      {
        id: "downtown_vc",
        name: "Downtown Vice City",
        centerX: -200,
        centerZ: -200,
        radius: 150,
        theme: "downtown",
        unlocked: true,
      },
      {
        id: "little_havana",
        name: "Little Havana",
        centerX: 200,
        centerZ: -100,
        radius: 100,
        theme: "residential",
        unlocked: true,
      },
      {
        id: "starfish_island",
        name: "Starfish Island",
        centerX: 0,
        centerZ: 200,
        radius: 80,
        theme: "hills",
        unlocked: false,
        unlockRequirement: { type: "money", value: 50000 },
      },
    ],
    roads: [],
    landmarks: [
      {
        id: "malibu_club",
        name: "Malibu Club",
        type: "entertainment",
        position: { x: 50, y: 0, z: 50 },
        interactable: true,
        description: "The hottest club in Vice City.",
      },
    ],
  },

  nyc: {
    id: "nyc",
    name: "Liberty City (NYC Style)",
    locale: "en-US",
    bounds: {
      minX: -1000,
      maxX: 1000,
      minZ: -1000,
      maxZ: 1000,
    },
    spawnPoints: [
      {
        id: "broker",
        type: "player",
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        default: true,
      },
    ],
    zones: [
      {
        id: "broker",
        name: "Broker",
        centerX: 0,
        centerZ: 0,
        radius: 200,
        theme: "residential",
        unlocked: true,
      },
      {
        id: "algonquin",
        name: "Algonquin",
        centerX: -300,
        centerZ: -100,
        radius: 250,
        theme: "downtown",
        unlocked: false,
        unlockRequirement: { type: "mission", value: "unlock_bridge" },
      },
      {
        id: "bohan",
        name: "Bohan",
        centerX: -200,
        centerZ: 200,
        radius: 100,
        theme: "slums",
        unlocked: true,
      },
    ],
    roads: [],
    landmarks: [],
  },

  custom: {
    id: "custom",
    name: "Custom Map",
    locale: "en-US",
    bounds: { minX: -500, maxX: 500, minZ: -500, maxZ: 500 },
    spawnPoints: [],
    zones: [],
    roads: [],
    landmarks: [],
  },
};

/**
 * MapLoader implementation with Redis support
 */
export class MapLoader implements IMapLoader {
  private redisUrl?: string;
  private redisToken?: string;

  constructor(redisUrl?: string, redisToken?: string) {
    this.redisUrl = redisUrl;
    this.redisToken = redisToken;
  }

  /**
   * Load a built-in map by type
   */
  async loadMap(mapType: MapType): Promise<MapConfig> {
    // Check for built-in maps
    const builtIn = BUILT_IN_MAPS[mapType];
    if (builtIn) {
      console.log(`📍 Loading built-in map: ${builtIn.name}`);
      return { ...builtIn };
    }

    // If custom, try loading from Redis
    if (mapType === "custom") {
      throw new Error("Custom map requires a map ID. Use loadCustomMap().");
    }

    throw new Error(`Unknown map type: ${mapType}`);
  }

  /**
   * Load a custom map from Redis by ID
   */
  async loadCustomMap(mapId: string): Promise<MapConfig | null> {
    if (!this.redisUrl || !this.redisToken) {
      console.warn("Redis not configured. Cannot load custom maps.");
      return null;
    }

    try {
      const response = await fetch(`${this.redisUrl}/get/map:${mapId}`, {
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.result) {
        const mapConfig =
          typeof data.result === "string"
            ? JSON.parse(data.result)
            : data.result;
        console.log(`📍 Loaded custom map: ${mapConfig.name}`);
        return mapConfig as MapConfig;
      }

      return null;
    } catch (error) {
      console.error("Failed to load custom map:", error);
      return null;
    }
  }

  /**
   * Save a custom map to Redis
   */
  async saveCustomMap(mapConfig: MapConfig): Promise<boolean> {
    if (!this.redisUrl || !this.redisToken) {
      console.warn("Redis not configured. Cannot save custom maps.");
      return false;
    }

    try {
      const response = await fetch(`${this.redisUrl}/set/map:${mapConfig.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mapConfig),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to save custom map:", error);
      return false;
    }
  }

  /**
   * List available maps
   */
  async listMaps(): Promise<
    Array<{ type: MapType; name: string; available: boolean }>
  > {
    const maps: Array<{ type: MapType; name: string; available: boolean }> = [];

    // Add built-in maps
    for (const [key, config] of Object.entries(BUILT_IN_MAPS)) {
      if (key !== "custom") {
        maps.push({
          type: key as MapType,
          name: config.name,
          available: true,
        });
      }
    }

    return maps;
  }

  /**
   * Get the default map for a locale
   */
  getDefaultMapForLocale(locale: string): MapType {
    if (locale.startsWith("de")) {
      return "nuernberg";
    }
    return "gta_sa";
  }
}

/**
 * Export a singleton instance with default configuration
 */
export const defaultMapLoader = new MapLoader(
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
);

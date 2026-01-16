// RedisMapLoader.ts - Load and manage map data from Redis with fallback

import { GameMap } from "./types";
import { ZONES, ROADS, PLAYER_SPAWN, LOCATIONS } from "./NuernbergMap";

export interface MapTile {
  id: string;
  x: number;
  z: number;
  type: "road" | "building" | "zone" | "trail" | "collectible";
  data: any;
  modifiedBy?: string;
  modifiedAt?: number;
}

export interface PlayerTrailPoint {
  x: number;
  z: number;
  timestamp: number;
  playerId: string;
  action?: string; // e.g., "collected_computer", "mined_data", "purchased_luxury"
}

export class RedisMapLoader {
  private mapCache: GameMap | null = null;
  private trailCache: Map<string, PlayerTrailPoint[]> = new Map();
  private isRedisAvailable: boolean = false;

  constructor() {
    this.checkRedisAvailability();
  }

  private async checkRedisAvailability(): Promise<void> {
    try {
      const response = await fetch("/api/game/map");
      this.isRedisAvailable = response.ok;
    } catch (error) {
      console.warn("Redis not available, using fallback map data");
      this.isRedisAvailable = false;
    }
  }

  /**
   * Load map data from Redis or fallback to default
   */
  async loadMap(): Promise<GameMap> {
    try {
      const response = await fetch("/api/game/map");
      if (response.ok) {
        const mapData = await response.json();
        this.mapCache = mapData;
        console.log("✅ Map loaded from Redis");
        return mapData;
      }
    } catch (error) {
      console.warn("Failed to load map from Redis, using fallback:", error);
    }

    // Fallback to default map
    return this.getDefaultMap();
  }

  /**
   * Get default map data based on NuernbergMap
   */
  private getDefaultMap(): GameMap {
    return {
      id: "nuernberg-main",
      name: "Nürnberg",
      width: 2000,
      height: 2000,
      spawnPosition: { x: PLAYER_SPAWN.position.x, y: PLAYER_SPAWN.position.z },
      zones: ZONES.map((zone) => ({
        id: zone.id,
        name: zone.name,
        type: zone.id as any,
        bounds: {
          minX: zone.bounds.minX,
          minY: zone.bounds.minZ,
          maxX: zone.bounds.maxX,
          maxY: zone.bounds.maxZ,
        },
        color: zone.theme === "slums" ? "#48bb78" : "#4a5568",
        description: zone.description,
      })),
      roads: ROADS.map((road) => ({
        id: road.id,
        type: road.type,
        name: road.name,
        width: road.width,
        points: road.points.map((p) => ({ x: p.x, y: p.z })),
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Save player trail to Redis
   */
  async savePlayerTrail(
    playerId: string,
    points: PlayerTrailPoint[],
  ): Promise<boolean> {
    if (!this.isRedisAvailable) {
      // Cache locally if Redis unavailable
      this.trailCache.set(playerId, points);
      return false;
    }

    try {
      const response = await fetch("/api/game/trail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, points }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to save trail:", error);
      return false;
    }
  }

  /**
   * Load player trails from Redis
   */
  async loadPlayerTrails(
    playerId?: string,
  ): Promise<Map<string, PlayerTrailPoint[]>> {
    if (!this.isRedisAvailable) {
      return this.trailCache;
    }

    try {
      const url = playerId
        ? `/api/game/trail?playerId=${playerId}`
        : "/api/game/trail";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const trails = new Map<string, PlayerTrailPoint[]>();

        if (data.trails) {
          Object.entries(data.trails).forEach(([id, points]) => {
            trails.set(id, points as PlayerTrailPoint[]);
          });
        }

        return trails;
      }
    } catch (error) {
      console.error("Failed to load trails:", error);
    }

    return new Map();
  }

  /**
   * Save map modification to Redis
   */
  async saveMapModification(
    x: number,
    z: number,
    modificationType: string,
    data: any,
    playerId: string,
  ): Promise<boolean> {
    if (!this.isRedisAvailable) {
      return false;
    }

    try {
      const response = await fetch("/api/game/map/modification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x,
          z,
          type: modificationType,
          data,
          playerId,
          timestamp: Date.now(),
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to save map modification:", error);
      return false;
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isRedisAvailable;
  }

  /**
   * Get cached map
   */
  getCachedMap(): GameMap | null {
    return this.mapCache;
  }
}

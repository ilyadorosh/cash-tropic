// CityDatabase. ts - Persistent city data

import { Building } from "./ProceduralCity";
import { BuildingPlot, CityBlock } from "./CityLayout";

export interface CityData {
  version: number;
  createdAt: string;
  updatedAt: string;
  buildings: BuildingSaveData[];
  unlockedZones: string[];
  playerProgress: {
    money: number;
    respect: number;
    relationship: number;
    completedMissions: string[];
  };
}

export interface BuildingSaveData {
  id: string;
  plotId: string;
  name: string;
  type: string;
  description: string;
  signs: Array<{
    text: string;
    position: string;
    color: string;
    bgColor: string;
  }>;
  color: number;
  generated: boolean;
}

const STORAGE_KEY = "nuernberg_city_data";
const CURRENT_VERSION = 1;

export class CityDatabase {
  private data: CityData;

  constructor() {
    this.data = this.load();
  }

  private getDefaultData(): CityData {
    return {
      version: CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      buildings: [],
      unlockedZones: ["Südstadt", "Innenstadt", "Gostenhof"],
      playerProgress: {
        money: 500,
        respect: 0,
        relationship: 50,
        completedMissions: [],
      },
    };
  }

  load(): CityData {
    if (typeof window === "undefined") {
      return this.getDefaultData();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CityData;
        if (parsed.version === CURRENT_VERSION) {
          console.log(`Loaded city with ${parsed.buildings.length} buildings`);
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load city data:", e);
    }

    return this.getDefaultData();
  }

  save() {
    if (typeof window === "undefined") return;

    this.data.updatedAt = new Date().toISOString();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      console.log(`Saved city with ${this.data.buildings.length} buildings`);
    } catch (e) {
      console.error("Failed to save city data:", e);
    }
  }

  addBuilding(building: Building, plotId: string) {
    const existing = this.data.buildings.find((b) => b.plotId === plotId);
    if (existing) return; // Plot already has building

    this.data.buildings.push({
      id: building.id,
      plotId,
      name: building.name,
      type: building.type,
      description: building.description,
      signs: building.signs,
      color: building.color,
      generated: building.generated,
    });

    this.save();
  }

  getBuildings(): BuildingSaveData[] {
    return this.data.buildings;
  }

  getBuildingForPlot(plotId: string): BuildingSaveData | undefined {
    return this.data.buildings.find((b) => b.plotId === plotId);
  }

  updateProgress(
    money: number,
    respect: number,
    relationship: number,
    missions: string[],
  ) {
    this.data.playerProgress = {
      money,
      respect,
      relationship,
      completedMissions: missions,
    };
    this.save();
  }

  getProgress() {
    return this.data.playerProgress;
  }

  unlockZone(zoneName: string) {
    if (!this.data.unlockedZones.includes(zoneName)) {
      this.data.unlockedZones.push(zoneName);
      this.save();
    }
  }

  isZoneUnlocked(zoneName: string): boolean {
    return this.data.unlockedZones.includes(zoneName);
  }

  reset() {
    this.data = this.getDefaultData();
    this.save();
    console.log("City data reset");
  }

  async syncToCloud(userId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/game/city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cityData: this.data,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Sync failed:", error);
      return false;
    }
  }

  async loadFromCloud(userId: string): Promise<CityData | null> {
    try {
      const response = await fetch(`/api/game/city?userId=${userId}`);
      const { city } = await response.json();
      return city ? JSON.parse(city) : null;
    } catch (error) {
      console.error("Load from cloud failed:", error);
      return null;
    }
  }
}

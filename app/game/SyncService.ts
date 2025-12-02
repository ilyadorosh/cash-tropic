// SyncService.ts - Sync local state with Redis Upstash

import { CityData } from "./CityDatabase";

interface SyncConfig {
  upstashUrl: string;
  upstashToken: string;
  userId: string;
}

export class SyncService {
  private config: SyncConfig;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private lastSyncTime: number = 0;
  private pendingChanges: boolean = false;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  async syncToCloud(data: CityData): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.upstashUrl}/set/${this.config.userId}:city`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.upstashToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            lastSync: new Date().toISOString(),
          }),
        },
      );

      if (response.ok) {
        this.lastSyncTime = Date.now();
        this.pendingChanges = false;
        console.log("✅ Synced to cloud");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Sync failed:", error);
      return false;
    }
  }

  async loadFromCloud(): Promise<CityData | null> {
    try {
      const response = await fetch(
        `${this.config.upstashUrl}/get/${this.config.userId}:city`,
        {
          headers: {
            Authorization: `Bearer ${this.config.upstashToken}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.result) {
          console.log("✅ Loaded from cloud");
          return JSON.parse(result.result);
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Load from cloud failed:", error);
      return null;
    }
  }

  // Save learning progress
  async saveLearningProgress(
    userId: string,
    progress: LearningProgress,
  ): Promise<void> {
    await fetch(`${this.config.upstashUrl}/set/${userId}:learning`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(progress),
    });
  }

  // Leaderboard for educational achievements
  async updateLeaderboard(
    userId: string,
    subject: string,
    score: number,
  ): Promise<void> {
    await fetch(`${this.config.upstashUrl}/zadd/leaderboard:${subject}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ score, member: userId }),
    });
  }

  startAutoSync(getData: () => CityData, intervalMs: number = 30000) {
    this.syncInterval = setInterval(() => {
      if (this.pendingChanges) {
        this.syncToCloud(getData());
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  markChanged() {
    this.pendingChanges = true;
  }
}

interface LearningProgress {
  odessons: Record<
    string,
    {
      moduleId: string;
      completed: boolean;
      score: number;
      completedAt?: string;
    }
  >;
  totalXp: number;
  level: number;
  achievements: string[];
}

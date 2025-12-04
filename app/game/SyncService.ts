// SyncService.ts - Sync local state with Redis Upstash and PostgreSQL

import { CityData } from "./CityDatabase";
import { PlayerProgress } from "./GameState";

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
        console.log("✅ Synced to cloud (Redis)");
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

  // Save full game state to PostgreSQL
  async saveToPostgres(progress: PlayerProgress): Promise<boolean> {
    try {
      const response = await fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });

      if (response.ok) {
        console.log("✅ Saved to PostgreSQL");
        return true;
      }
      console.error("❌ PostgreSQL save failed:", await response.text());
      return false;
    } catch (error) {
      console.error("❌ PostgreSQL save error:", error);
      return false;
    }
  }

  // Load full game state from PostgreSQL
  async loadFromPostgres(userId: string): Promise<PlayerProgress | null> {
    try {
      const response = await fetch(`/api/game/load/${userId}`);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Loaded from PostgreSQL");
        return data.progress;
      } else if (response.status === 404) {
        console.log("ℹ️ No PostgreSQL save found");
        return null;
      }
      console.error("❌ PostgreSQL load failed:", await response.text());
      return null;
    } catch (error) {
      console.error("❌ PostgreSQL load error:", error);
      return null;
    }
  }

  // Update specific progress in PostgreSQL
  async updateProgress(
    userId: string,
    type:
      | "stats"
      | "learning"
      | "mission"
      | "twelveSteps"
      | "relationship"
      | "property",
    data: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/game/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type, data }),
      });

      if (response.ok) {
        console.log(`✅ Updated ${type} in PostgreSQL`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Failed to update ${type}:`, error);
      return false;
    }
  }

  // Save learning progress to both Redis and PostgreSQL
  async saveLearningProgress(
    userId: string,
    progress: LearningProgress,
  ): Promise<void> {
    // Redis (fast cache)
    await fetch(`${this.config.upstashUrl}/set/${userId}:learning`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(progress),
    });

    // PostgreSQL (persistent)
    await this.updateProgress(userId, "learning", {
      subject: progress.subject || "general",
      level: progress.level,
      xp: progress.totalXp,
      achievements: progress.achievements,
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
  subject?: string;
  lessons: Record<
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

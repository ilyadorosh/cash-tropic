// GameManager.ts - Handles loading, saving, and game loop integration

import { PlayerProgress, WorldState, createDefaultProgress } from "./GameState";

export class GameManager {
  private progress: PlayerProgress | null = null;
  private worldState: WorldState | null = null;
  private saveInterval: ReturnType<typeof setInterval> | null = null;
  private isDirty: boolean = false;

  // Load game - tries PostgreSQL first, then Redis, then localStorage
  async loadGame(
    userId: string,
  ): Promise<{ progress: PlayerProgress; world: WorldState }> {
    console.log("🎮 Loading game for user:", userId);

    // Try PostgreSQL first (persistent storage)
    let progress = await this.loadFromPostgres(userId);

    // Fall back to Redis cloud cache
    if (!progress) {
      progress = await this.loadFromCloud(userId);
    }

    // Fall back to localStorage
    if (!progress) {
      progress = this.loadFromLocal(userId);
    }

    // Create new if nothing exists
    if (!progress) {
      console.log("🆕 Creating new game");
      progress = createDefaultProgress(userId, "Spieler");
    }

    this.progress = progress;

    // Load or generate world
    this.worldState = await this.loadWorld(userId);

    // Start auto-save
    this.startAutoSave(userId);

    return { progress: this.progress, world: this.worldState };
  }

  private async loadFromPostgres(
    userId: string,
  ): Promise<PlayerProgress | null> {
    try {
      const res = await fetch(`/api/game/load/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.progress) {
          console.log("🐘 Loaded from PostgreSQL");
          return data.progress;
        }
      }
    } catch (e) {
      console.warn("PostgreSQL load failed:", e);
    }
    return null;
  }

  private async loadFromCloud(userId: string): Promise<PlayerProgress | null> {
    try {
      const res = await fetch(`/api/game/city?userId=${userId}`);
      if (res.ok) {
        const { city } = await res.json();
        if (city) {
          console.log("☁️ Loaded from Redis cloud");
          return typeof city === "string" ? JSON.parse(city) : city;
        }
      }
    } catch (e) {
      console.warn("Cloud load failed:", e);
    }
    return null;
  }

  private loadFromLocal(userId: string): PlayerProgress | null {
    if (typeof window === "undefined") return null;

    try {
      const data = localStorage.getItem(`nuernberg_save_${userId}`);
      if (data) {
        console.log("💾 Loaded from localStorage");
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("Local load failed:", e);
    }
    return null;
  }

  private async loadWorld(userId: string): Promise<WorldState> {
    // Try to load saved world state
    try {
      const res = await fetch(`/api/game?key=world:${userId}`);
      if (res.ok) {
        const { result } = await res.json();
        if (result) {
          return typeof result === "string" ? JSON.parse(result) : result;
        }
      }
    } catch (e) {
      console.warn("World load failed, generating new:", e);
    }

    // Generate default world
    return {
      buildings: [],
      npcs: [],
      trafficEnabled: true,
      timeOfDay: 12,
      weather: "sunny",
    };
  }

  // Save game to all storage layers
  async saveGame(): Promise<boolean> {
    if (!this.progress) return false;

    this.progress.lastSaved = new Date().toISOString();

    // Save to localStorage immediately (fast, offline support)
    this.saveToLocal();

    // Save to PostgreSQL (persistent, reliable)
    const postgresSaved = await this.saveToPostgres();

    // Also sync to Redis (fast cache for multiplayer)
    const cloudSaved = await this.saveToCloud();

    this.isDirty = false;
    console.log(
      "💾 Game saved",
      postgresSaved ? "(+ PostgreSQL)" : "",
      cloudSaved ? "(+ Redis)" : "",
    );

    return postgresSaved || cloudSaved;
  }

  private saveToLocal() {
    if (typeof window === "undefined" || !this.progress) return;

    try {
      localStorage.setItem(
        `nuernberg_save_${this.progress.userId}`,
        JSON.stringify(this.progress),
      );
    } catch (e) {
      console.error("Local save failed:", e);
    }
  }

  private async saveToPostgres(): Promise<boolean> {
    if (!this.progress) return false;

    try {
      const res = await fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.progress),
      });
      return res.ok;
    } catch (e) {
      console.warn("PostgreSQL save failed:", e);
      return false;
    }
  }

  private async saveToCloud(): Promise<boolean> {
    if (!this.progress) return false;

    try {
      const res = await fetch("/api/game/city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: this.progress.userId,
          cityData: this.progress,
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn("Cloud save failed:", e);
      return false;
    }
  }

  private startAutoSave(userId: string) {
    // Auto-save every 30 seconds if dirty
    this.saveInterval = setInterval(() => {
      if (this.isDirty) {
        this.saveGame();
      }
    }, 30000);
  }

  // Mark state as changed (needs save)
  markDirty() {
    this.isDirty = true;
  }

  // Update methods
  updateMoney(delta: number) {
    if (!this.progress) return;
    this.progress.money = Math.max(0, this.progress.money + delta);
    this.markDirty();
  }

  updateHealth(delta: number) {
    if (!this.progress) return;
    this.progress.health = Math.max(
      0,
      Math.min(100, this.progress.health + delta),
    );
    this.markDirty();
  }

  completeMission(
    missionId: string,
    reward?: {
      money?: number;
      respect?: number;
      xp?: { subject: string; amount: number };
    },
  ) {
    if (!this.progress) return;

    if (!this.progress.completedMissions.includes(missionId)) {
      this.progress.completedMissions.push(missionId);

      if (reward) {
        if (reward.money) this.progress.money += reward.money;
        if (reward.respect) this.progress.respect += reward.respect;
        if (reward.xp) {
          const track =
            this.progress.learning[
              reward.xp.subject as keyof typeof this.progress.learning
            ];
          if (track) {
            track.xp += reward.xp.amount;
            // Level up check
            if (track.xp >= track.level * 100) {
              track.level++;
              track.xp -= (track.level - 1) * 100;
            }
          }
        }
      }

      // Auto-save on mission complete (important event)
      this.saveGame();
    }
  }

  completeLesson(subject: string, lessonId: string, score: number) {
    if (!this.progress) return;

    const track =
      this.progress.learning[subject as keyof typeof this.progress.learning];
    if (!track) return;

    if (!track.lessonsCompleted.includes(lessonId)) {
      track.lessonsCompleted.push(lessonId);
      track.quizScores[lessonId] = score;
      track.xp += Math.floor(score / 10) * 10; // XP based on score

      // Level up check
      const xpForLevelUp = track.level * 100;
      if (track.xp >= xpForLevelUp) {
        track.level++;
        track.xp -= xpForLevelUp;
        // Auto-save on level up (important event)
        this.saveGame();
      } else {
        this.markDirty();
      }

      // Update leaderboard
      this.updateLeaderboard(subject, track.xp + (track.level - 1) * 100);
    }
  }

  private async updateLeaderboard(subject: string, score: number) {
    if (!this.progress) return;

    try {
      await fetch("/api/game/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          userId: this.progress.userId,
          score,
        }),
      });
    } catch (e) {
      console.warn("Leaderboard update failed:", e);
    }
  }

  // 12 Steps progression
  advanceStep() {
    if (!this.progress) return;

    const current = this.progress.twelveSteps.currentStep;
    if (current < 12) {
      this.progress.twelveSteps.stepsCompleted[current] = true;
      this.progress.twelveSteps.currentStep++;
      // Auto-save on step completion (important event)
      this.saveGame();
    }
  }

  addSobrietyDay() {
    if (!this.progress) return;
    this.progress.twelveSteps.sobrietyDays++;
    this.markDirty();
  }

  makeAmends(npcId: string) {
    if (!this.progress) return;
    if (!this.progress.twelveSteps.amends.includes(npcId)) {
      this.progress.twelveSteps.amends.push(npcId);
      // Improve relationship
      if (this.progress.relationships[npcId] !== undefined) {
        this.progress.relationships[npcId] = Math.min(
          100,
          this.progress.relationships[npcId] + 20,
        );
      }
      // Auto-save on making amends (important event)
      this.saveGame();
    }
  }

  getProgress(): PlayerProgress | null {
    return this.progress;
  }

  cleanup() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.saveGame(); // Final save
  }
}

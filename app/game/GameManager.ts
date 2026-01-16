// GameManager.ts - Handles loading, saving, and game loop integration

import { PlayerProgress, WorldState, createDefaultProgress } from "./GameState";
import { LuxuryPlanCompute, PLAN_DEFINITIONS } from "./LuxuryPlanCompute";
import { MoneyGather } from "./MoneyGather";

export class GameManager {
  private progress: PlayerProgress | null = null;
  private worldState: WorldState | null = null;
  private saveInterval: ReturnType<typeof setInterval> | null = null;
  private isDirty: boolean = false;
  private planCompute: LuxuryPlanCompute | null = null;
  private moneyGather: MoneyGather | null = null;

  // Load game - tries cloud first, falls back to local
  async loadGame(
    userId: string,
  ): Promise<{ progress: PlayerProgress; world: WorldState }> {
    console.log("🎮 Loading game for user:", userId);

    // Try cloud first
    let progress = await this.loadFromCloud(userId);

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

    // Initialize plan compute system
    if (this.progress.plan) {
      // Ensure features are computed from tier
      this.progress.plan.features = PLAN_DEFINITIONS[this.progress.plan.tier];
      this.planCompute = new LuxuryPlanCompute(this.progress.plan);
    } else {
      this.planCompute = new LuxuryPlanCompute();
    }

    // Initialize money gather system
    if (this.progress.moneyGatherState) {
      this.moneyGather = MoneyGather.deserialize(
        this.progress.moneyGatherState,
        this.planCompute,
      );
    } else {
      this.moneyGather = new MoneyGather(this.progress.money, this.planCompute);
      // Add property sources
      const propertySources = MoneyGather.createPropertySources(
        this.progress.ownedProperties,
      );
      propertySources.forEach((source) => this.moneyGather!.addSource(source));
    }

    // Load or generate world
    this.worldState = await this.loadWorld(userId);

    // Start auto-save
    this.startAutoSave(userId);

    return { progress: this.progress, world: this.worldState };
  }

  private async loadFromCloud(userId: string): Promise<PlayerProgress | null> {
    try {
      const res = await fetch(`/api/game/city?userId=${userId}`);
      if (res.ok) {
        const { city } = await res.json();
        if (city) {
          console.log("☁️ Loaded from cloud");
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

  // Save game
  async saveGame(): Promise<boolean> {
    if (!this.progress) return false;

    this.progress.lastSaved = new Date().toISOString();

    // Save meta features state
    if (this.planCompute) {
      this.progress.plan = this.planCompute.getPlan();
    }
    if (this.moneyGather) {
      this.progress.moneyGatherState = this.moneyGather.serialize();
      this.progress.money = this.moneyGather.getBalance();
    }

    // Save to localStorage immediately (fast)
    this.saveToLocal();

    // Sync to cloud (async)
    const cloudSaved = await this.saveToCloud();

    this.isDirty = false;
    console.log("💾 Game saved", cloudSaved ? "(+ cloud)" : "(local only)");

    return true;
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
    if (!this.progress || !this.moneyGather) return;
    if (delta > 0) {
      this.moneyGather.addMoney(delta, "game_event");
    } else {
      this.moneyGather.spendMoney(Math.abs(delta));
    }
    this.progress.money = this.moneyGather.getBalance();
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

      this.markDirty();
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

      // Update leaderboard
      this.updateLeaderboard(subject, track.xp);

      this.markDirty();
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
      this.markDirty();
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
      this.markDirty();
    }
  }

  getProgress(): PlayerProgress | null {
    return this.progress;
  }

  // Money Gather methods
  collectPassiveIncome(): number {
    if (!this.moneyGather) return 0;
    const results = this.moneyGather.autoCollect();
    const totalCollected = results.reduce((sum, r) => sum + r.amount, 0);
    if (totalCollected > 0 && this.progress) {
      this.progress.money = this.moneyGather.getBalance();
      this.markDirty();
    }
    return totalCollected;
  }

  getMoneyStats() {
    return this.moneyGather?.getStats();
  }

  // Plan management methods
  getPlanFeature<K extends keyof import("./LuxuryPlanCompute").PlanFeatures>(
    feature: K,
  ) {
    return this.planCompute?.getFeature(feature);
  }

  hasFeature(
    feature: keyof import("./LuxuryPlanCompute").PlanFeatures,
  ): boolean {
    return this.planCompute?.hasFeature(feature) ?? false;
  }

  cleanup() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.saveGame(); // Final save
  }
}

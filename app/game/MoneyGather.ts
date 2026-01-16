// MoneyGather.ts - Money collection and passive income system

import { LuxuryPlanCompute } from "./LuxuryPlanCompute";

export interface MoneySource {
  id: string;
  name: string;
  type: "property" | "business" | "investment" | "mission" | "passive";
  baseIncome: number;
  frequency: number; // in milliseconds
  lastCollected: number;
  active: boolean;
}

export interface MoneyStats {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  passiveIncomePerHour: number;
  activeSources: number;
}

export interface GatherResult {
  amount: number;
  source: MoneySource;
  multiplier: number;
  timestamp: number;
}

export class MoneyGather {
  private sources: Map<string, MoneySource> = new Map();
  private stats: MoneyStats;
  private planCompute: LuxuryPlanCompute;
  private gatherHistory: GatherResult[] = [];

  constructor(
    initialBalance: number = 500,
    planCompute?: LuxuryPlanCompute,
  ) {
    this.stats = {
      totalEarned: 0,
      totalSpent: 0,
      currentBalance: initialBalance,
      passiveIncomePerHour: 0,
      activeSources: 0,
    };
    this.planCompute = planCompute ?? new LuxuryPlanCompute();
  }

  // Add a money source
  addSource(source: MoneySource): void {
    this.sources.set(source.id, source);
    this.recalculatePassiveIncome();
  }

  // Remove a money source
  removeSource(sourceId: string): void {
    this.sources.delete(sourceId);
    this.recalculatePassiveIncome();
  }

  // Get all active sources
  getActiveSources(): MoneySource[] {
    return Array.from(this.sources.values()).filter((s) => s.active);
  }

  // Collect money from a specific source
  collectFromSource(sourceId: string): GatherResult | null {
    const source = this.sources.get(sourceId);
    if (!source || !source.active) return null;

    const now = Date.now();
    const timeSinceLastCollection = now - source.lastCollected;

    // Check if enough time has passed
    if (timeSinceLastCollection < source.frequency) {
      return null;
    }

    // Calculate how many collection periods have passed
    const periods = Math.floor(timeSinceLastCollection / source.frequency);

    // Compute money with plan multiplier
    const multiplier = this.planCompute.computeGatherRate(1.0);
    const amount = source.baseIncome * periods * multiplier;

    // Update source
    source.lastCollected = now;
    this.sources.set(sourceId, source);

    // Update stats
    this.stats.currentBalance += amount;
    this.stats.totalEarned += amount;

    const result: GatherResult = {
      amount,
      source,
      multiplier,
      timestamp: now,
    };

    this.gatherHistory.push(result);
    if (this.gatherHistory.length > 100) {
      this.gatherHistory.shift(); // Keep only last 100
    }

    return result;
  }

  // Collect from all available sources
  collectAll(): GatherResult[] {
    const results: GatherResult[] = [];
    for (const source of this.sources.values()) {
      const result = this.collectFromSource(source.id);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  // Auto-collect (for passive income)
  autoCollect(): GatherResult[] {
    const passiveSources = this.getActiveSources().filter(
      (s) => s.type === "passive" || s.type === "property" || s.type === "business",
    );

    const results: GatherResult[] = [];
    for (const source of passiveSources) {
      const result = this.collectFromSource(source.id);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  // Add money (from missions, etc.)
  addMoney(amount: number, reason: string = "misc"): void {
    this.stats.currentBalance += amount;
    this.stats.totalEarned += amount;
  }

  // Spend money
  spendMoney(amount: number): boolean {
    if (this.stats.currentBalance < amount) {
      return false; // Not enough money
    }
    this.stats.currentBalance -= amount;
    this.stats.totalSpent += amount;
    return true;
  }

  // Get current balance
  getBalance(): number {
    return this.stats.currentBalance;
  }

  // Get statistics
  getStats(): MoneyStats {
    return { ...this.stats };
  }

  // Get recent gather history
  getHistory(count: number = 10): GatherResult[] {
    return this.gatherHistory.slice(-count);
  }

  // Calculate potential income from a source over time
  calculatePotentialIncome(sourceId: string, hours: number): number {
    const source = this.sources.get(sourceId);
    if (!source) return 0;

    const periodsPerHour = 3600000 / source.frequency; // ms in hour / frequency
    const periods = periodsPerHour * hours;
    const multiplier = this.planCompute.computeGatherRate(1.0);

    return source.baseIncome * periods * multiplier;
  }

  // Recalculate passive income per hour
  private recalculatePassiveIncome(): void {
    let incomePerHour = 0;
    let activeCount = 0;

    for (const source of this.sources.values()) {
      if (source.active && (source.type === "passive" || source.type === "property" || source.type === "business")) {
        const periodsPerHour = 3600000 / source.frequency;
        incomePerHour += source.baseIncome * periodsPerHour;
        activeCount++;
      }
    }

    const multiplier = this.planCompute.computeGatherRate(1.0);
    this.stats.passiveIncomePerHour = incomePerHour * multiplier;
    this.stats.activeSources = activeCount;
  }

  // Create default property sources based on owned properties
  static createPropertySources(ownedProperties: string[]): MoneySource[] {
    const propertyDefinitions: Record<
      string,
      { income: number; frequency: number }
    > = {
      apartment: { income: 50, frequency: 3600000 }, // 50 per hour
      house: { income: 100, frequency: 3600000 }, // 100 per hour
      shop: { income: 150, frequency: 1800000 }, // 150 per 30 min
      restaurant: { income: 200, frequency: 1800000 }, // 200 per 30 min
      factory: { income: 500, frequency: 3600000 }, // 500 per hour
      office: { income: 300, frequency: 3600000 }, // 300 per hour
    };

    return ownedProperties.map((propName) => {
      const def = propertyDefinitions[propName] ?? {
        income: 100,
        frequency: 3600000,
      };

      return {
        id: `property_${propName}_${Date.now()}`,
        name: propName,
        type: "property" as const,
        baseIncome: def.income,
        frequency: def.frequency,
        lastCollected: Date.now(),
        active: true,
      };
    });
  }

  // Save state to JSON
  serialize(): string {
    return JSON.stringify({
      sources: Array.from(this.sources.entries()),
      stats: this.stats,
      history: this.gatherHistory.slice(-50), // Save last 50
    });
  }

  // Load state from JSON
  static deserialize(
    data: string,
    planCompute?: LuxuryPlanCompute,
  ): MoneyGather {
    const parsed = JSON.parse(data);
    const gather = new MoneyGather(
      parsed.stats?.currentBalance ?? 500,
      planCompute,
    );

    if (parsed.sources) {
      gather.sources = new Map(parsed.sources);
    }

    if (parsed.stats) {
      gather.stats = parsed.stats;
    }

    if (parsed.history) {
      gather.gatherHistory = parsed.history;
    }

    gather.recalculatePassiveIncome();
    return gather;
  }
}

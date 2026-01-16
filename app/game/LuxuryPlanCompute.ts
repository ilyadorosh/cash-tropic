// LuxuryPlanCompute.ts - Subscription tier system with feature computation

export enum PlanTier {
  FREE = "free",
  BASIC = "basic",
  LUXURY = "luxury",
  PREMIUM = "premium",
}

export interface PlanFeatures {
  // Game features
  maxSaveSl ots: number;
  cloudSaveEnabled: boolean;
  multiplayerEnabled: boolean;
  customizationLevel: number; // 0-3

  // Economy features
  passiveIncomeMultiplier: number;
  bonusStartingMoney: number;
  moneyGatherBoost: number;

  // Content features
  exclusiveMissions: boolean;
  advancedLearningModules: boolean;
  premiumInteriors: boolean;

  // Social features
  friendsLimit: number;
  canCreateGuilds: boolean;
  chatHistoryDays: number;

  // Technical features
  prioritySupport: boolean;
  betaAccess: boolean;
  adFree: boolean;
}

export interface UserPlan {
  tier: PlanTier;
  features: PlanFeatures;
  startDate: string;
  expiryDate?: string;
  autoRenew: boolean;
}

// Plan tier definitions with computed features
export const PLAN_DEFINITIONS: Record<PlanTier, PlanFeatures> = {
  [PlanTier.FREE]: {
    maxSaveSlots: 1,
    cloudSaveEnabled: false,
    multiplayerEnabled: false,
    customizationLevel: 0,
    passiveIncomeMultiplier: 1.0,
    bonusStartingMoney: 0,
    moneyGatherBoost: 1.0,
    exclusiveMissions: false,
    advancedLearningModules: false,
    premiumInteriors: false,
    friendsLimit: 10,
    canCreateGuilds: false,
    chatHistoryDays: 7,
    prioritySupport: false,
    betaAccess: false,
    adFree: false,
  },
  [PlanTier.BASIC]: {
    maxSaveSlots: 3,
    cloudSaveEnabled: true,
    multiplayerEnabled: true,
    customizationLevel: 1,
    passiveIncomeMultiplier: 1.25,
    bonusStartingMoney: 1000,
    moneyGatherBoost: 1.2,
    exclusiveMissions: false,
    advancedLearningModules: true,
    premiumInteriors: false,
    friendsLimit: 50,
    canCreateGuilds: false,
    chatHistoryDays: 30,
    prioritySupport: false,
    betaAccess: false,
    adFree: true,
  },
  [PlanTier.LUXURY]: {
    maxSaveSlots: 10,
    cloudSaveEnabled: true,
    multiplayerEnabled: true,
    customizationLevel: 2,
    passiveIncomeMultiplier: 1.5,
    bonusStartingMoney: 5000,
    moneyGatherBoost: 1.5,
    exclusiveMissions: true,
    advancedLearningModules: true,
    premiumInteriors: true,
    friendsLimit: 200,
    canCreateGuilds: true,
    chatHistoryDays: 90,
    prioritySupport: true,
    betaAccess: true,
    adFree: true,
  },
  [PlanTier.PREMIUM]: {
    maxSaveSlots: -1, // unlimited
    cloudSaveEnabled: true,
    multiplayerEnabled: true,
    customizationLevel: 3,
    passiveIncomeMultiplier: 2.0,
    bonusStartingMoney: 10000,
    moneyGatherBoost: 2.0,
    exclusiveMissions: true,
    advancedLearningModules: true,
    premiumInteriors: true,
    friendsLimit: -1, // unlimited
    canCreateGuilds: true,
    chatHistoryDays: -1, // unlimited
    prioritySupport: true,
    betaAccess: true,
    adFree: true,
  },
};

// Pricing information
export const PLAN_PRICING: Record<PlanTier, { monthly: number; yearly: number }> = {
  [PlanTier.FREE]: { monthly: 0, yearly: 0 },
  [PlanTier.BASIC]: { monthly: 4.99, yearly: 49.99 },
  [PlanTier.LUXURY]: { monthly: 9.99, yearly: 99.99 },
  [PlanTier.PREMIUM]: { monthly: 19.99, yearly: 199.99 },
};

export class LuxuryPlanCompute {
  private currentPlan: UserPlan;

  constructor(userPlan?: UserPlan) {
    this.currentPlan = userPlan ?? this.createDefaultPlan();
  }

  private createDefaultPlan(): UserPlan {
    return {
      tier: PlanTier.FREE,
      features: PLAN_DEFINITIONS[PlanTier.FREE],
      startDate: new Date().toISOString(),
      autoRenew: false,
    };
  }

  // Get current plan
  getPlan(): UserPlan {
    return this.currentPlan;
  }

  // Get specific feature value
  getFeature<K extends keyof PlanFeatures>(featureName: K): PlanFeatures[K] {
    return this.currentPlan.features[featureName];
  }

  // Check if user has access to a feature
  hasFeature(featureName: keyof PlanFeatures): boolean {
    const value = this.currentPlan.features[featureName];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    return false;
  }

  // Check if plan is active
  isActive(): boolean {
    if (!this.currentPlan.expiryDate) return true;
    return new Date(this.currentPlan.expiryDate) > new Date();
  }

  // Upgrade plan
  upgradePlan(newTier: PlanTier, durationMonths: number = 1): UserPlan {
    const now = new Date();
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + durationMonths);

    this.currentPlan = {
      tier: newTier,
      features: PLAN_DEFINITIONS[newTier],
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      autoRenew: false,
    };

    return this.currentPlan;
  }

  // Compute effective money multiplier based on plan + other factors
  computeMoneyMultiplier(baseMultiplier: number = 1.0): number {
    if (!this.isActive()) return baseMultiplier;
    return baseMultiplier * this.currentPlan.features.passiveIncomeMultiplier;
  }

  // Compute money gather rate
  computeGatherRate(baseRate: number): number {
    if (!this.isActive()) return baseRate;
    return baseRate * this.currentPlan.features.moneyGatherBoost;
  }

  // Get plan comparison for UI
  static getPlanComparison(): Record<PlanTier, PlanFeatures> {
    return PLAN_DEFINITIONS;
  }

  // Get pricing info
  static getPricing(): typeof PLAN_PRICING {
    return PLAN_PRICING;
  }
}

// GameState. ts - Central state management for the game

import { PlanTier, UserPlan } from "./LuxuryPlanCompute";

export interface PlayerProgress {
  userId: string;

  // Basic stats
  money: number;
  health: number;
  respect: number;
  wantedLevel: number;

  // Meta features
  plan?: UserPlan;
  moneyGatherState?: string; // Serialized MoneyGather state

  // Learning progress
  learning: {
    physics: LearningTrack;
    math: LearningTrack;
    finance: LearningTrack;
    health: LearningTrack;
    spiritual: LearningTrack;
  };

  // Story progress
  completedMissions: string[];
  currentMission: string | null;
  relationships: Record<string, number>; // NPC affection levels

  // 12 Steps progress
  twelveSteps: {
    currentStep: number;
    stepsCompleted: boolean[];
    sobrietyDays: number;
    sponsor: string | null;
    amends: string[]; // NPCs made amends to
  };

  // World state
  unlockedZones: string[];
  ownedProperties: string[];

  // Meta
  playTime: number;
  createdAt: string;
  lastSaved: string;
}

export interface LearningTrack {
  level: number;
  xp: number;
  lessonsCompleted: string[];
  currentLesson: string | null;
  achievements: string[];
  quizScores: Record<string, number>;
}

export interface WorldState {
  buildings: BuildingState[];
  npcs: NPCState[];
  trafficEnabled: boolean;
  timeOfDay: number; // 0-24
  weather: "sunny" | "cloudy" | "rainy";
}

export interface BuildingState {
  id: string;
  plotId: string;
  name: string;
  type: string;
  color: number;
  signs: Array<{ text: string; position: string }>;
  owner?: string;
  interior?: string;
}

export interface NPCState {
  id: string;
  position: { x: number; z: number };
  state: "idle" | "walking" | "talking" | "following";
  memory: string[]; // What this NPC remembers about player
  affection: number;
}

// Default starting state
export function createDefaultProgress(
  userId: string,
  name: string,
): PlayerProgress {
  return {
    userId,
    money: 500,
    health: 100,
    respect: 0,
    wantedLevel: 0,

    // Meta features - start with free tier
    plan: {
      tier: PlanTier.FREE,
      features: undefined as any, // Will be computed
      startDate: new Date().toISOString(),
      autoRenew: false,
    },
    moneyGatherState: undefined,

    learning: {
      physics: createDefaultTrack(),
      math: createDefaultTrack(),
      finance: createDefaultTrack(),
      health: createDefaultTrack(),
      spiritual: createDefaultTrack(),
    },

    completedMissions: [],
    currentMission: null,
    relationships: {
      MARLENE: 50,
      PFARRER_MUELLER: 60,
      MC_LUKAS: 40,
      PROFESSOR_WEBER: 50,
      SPONSOR_KLAUS: 50,
    },

    twelveSteps: {
      currentStep: 0,
      stepsCompleted: Array(12).fill(false),
      sobrietyDays: 0,
      sponsor: null,
      amends: [],
    },

    unlockedZones: ["Südstadt", "Innenstadt", "Gostenhof"],
    ownedProperties: [],

    playTime: 0,
    createdAt: new Date().toISOString(),
    lastSaved: new Date().toISOString(),
  };
}

function createDefaultTrack(): LearningTrack {
  return {
    level: 1,
    xp: 0,
    lessonsCompleted: [],
    currentLesson: null,
    achievements: [],
    quizScores: {},
  };
}

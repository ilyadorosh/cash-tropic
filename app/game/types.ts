// Combined types for 2D map and 3D game subsystems
// This file merges the map-focused types (2D) and gameplay/AI types (3D)

// 2D Map helpers
export interface Position {
  x: number;
  y: number;
}

export type Vec3 = [number, number, number];

export type ZoneType =
  | "suedstadt"
  | "innenstadt"
  | "gostenhof"
  | "nordstadt"
  | "weststadt"
  | "oststadt"
  | "langwasser";

export type RoadType = "autobahn" | "hauptstrasse" | "nebenstrasse";

export type BuildingType =
  | "factory"
  | "house"
  | "church"
  | "museum"
  | "shop"
  | "restaurant"
  | "hospital"
  | "school"
  | "office"
  | "historical";

export type MissionCategory =
  | "physics"
  | "finance"
  | "health"
  | "spiritual"
  | "historical";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  color: string;
  description?: string;
}

export interface Road {
  id: string;
  type: RoadType;
  points: Position[];
  width: number;
  name?: string;
}

export interface Building {
  id: string;
  type: BuildingType;
  name: string;
  description?: string;
  position: Position;
  width: number;
  height: number;
  color?: string;
  interactable?: boolean;
  missionId?: string;
}

export interface NPCDialogue {
  id: string;
  text: string;
  responses?: { text: string; nextDialogueId?: string; action?: string }[];
}

export interface NPC {
  id: string;
  name: string;
  position: Position;
  personality?: string;
  dialogues: NPCDialogue[];
  isHistorical?: boolean;
  sprite?: string;
  color?: string;
}

export interface MissionObjective {
  id: string;
  description: string;
  completed: boolean;
  targetPosition?: Position;
  targetNpcId?: string;
  targetBuildingId?: string;
}

// Unified Mission interface
// This covers both 2D map missions (title/description/objectives) and 3D in-world missions (pos/camPos/dialogue/reward)
export interface Mission {
  id: string;

  // Common map-facing fields
  title?: string;
  name?: string;
  description?: string;
  category?: MissionCategory;
  stepNumber?: number;
  objectives?: MissionObjective[];
  reward?: { xp?: number; money?: number; item?: string; respect?: number };
  prerequisites?: string[];
  unlocked?: boolean;
  completed?: boolean;
  startPosition?: Position;
  npcId?: string;

  // 3D/gameplay-specific fields
  pos?: Vec3;
  camPos?: Vec3;
  lookAt?: Vec3;
  dialogue?: string[];
  prerequisite?: string; // legacy single prerequisite
}

// Player trace point for multiplayer ghosts
export interface TracePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface PlayerTrace {
  id: string;
  playerId: string;
  playerName?: string;
  points: TracePoint[];
  startTime: number;
  endTime?: number;
  isHistorical?: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  position: Position;
  health: number;
  money: number;
  xp: number;
  level: number;
  wantedLevel: number;
  currentMissionId?: string;
  completedMissions: string[];
  inventory: string[];
  lastSaveTime: number;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  zones: Zone[];
  roads: Road[];
  spawnPosition: Position;
  createdAt: number;
  updatedAt: number;
}

export const HISTORICAL_FIGURES = {
  SIGMUND_SCHUCKERT: {
    id: "schuckert",
    name: "Sigmund Schuckert",
    description: "Electrical pioneer who founded Schuckert & Co.",
    era: "1846-1895",
  },
  PETER_HENLEIN: {
    id: "henlein",
    name: "Peter Henlein",
    description: "Inventor of the pocket watch (Taschenuhr)",
    era: "1485-1542",
  },
  ALBRECHT_DURER: {
    id: "durer",
    name: "Albrecht Dürer",
    description: "Famous Renaissance artist",
    era: "1471-1528",
  },
} as const;

export const DEFAULT_SPAWN_POSITION: Position = { x: 400, y: 300 };
export const DEFAULT_MAP_SIZE = { width: 2000, height: 2000 };

// Gameplay / AI-focused types
export interface GameStats {
  speed: string;
  health: number;
  mission: number;
  money: number;
  wanted: number;
  isCutscene: boolean;
  respect: number;
  relationship: number;
}

export interface DialogueOption {
  text: string;
  action?: () => void;
  requirement?: () => boolean;
}

export interface Dialogue {
  title: string;
  text: string;
  options?: DialogueOption[];
}

export interface NPCSchedule {
  hour: number;
  location: Vec3;
  activity: string;
}

export interface NPCPersonality {
  name: string;
  role: "pedestrian" | "police" | "gang" | "story" | "girlfriend" | "merchant";
  systemPrompt: string;
  voicePitch: number;
  voiceRate: number;
  defaultLines: string[];
  memory: string[];
  affection?: number;
  schedule?: NPCSchedule[];
}

export interface PoliceState {
  phase: "patrol" | "warning" | "pursuit" | "arrest" | "combat";
  warningsGiven: number;
  lastWarningTime: number;
  negotiating: boolean;
}

export interface ThiefMissionState {
  phase:
    | "not_started"
    | "find_thief"
    | "convince"
    | "escort"
    | "deliver"
    | "complete";
  thiefTrust: number;
  dialogueIndex: number;
}

export interface AIAgent {
  id: string;
  personality: NPCPersonality;
  position: { x: number; y: number; z: number };
  currentGoal: string;
  shortTermMemory: string[];
  longTermMemory: string[];
  relationships: Record<string, number>;
  lastAction: string;
  nextActionTime: number;
}

export interface Notification {
  id: string;
  type:
    | "location"
    | "business"
    | "zone"
    | "money"
    | "mission"
    | "computer"
    | "data"
    | "luxury";
  title: string;
  subtitle?: string;
  duration: number;
  startTime: number;
}

// New gameplay mechanics types

export interface Computer {
  id: string;
  position: Vec3;
  type: "laptop" | "desktop" | "server" | "supercomputer";
  brand: string;
  value: number; // Cash value
  miningPower: number; // Data mining capability
  collected: boolean;
  respawnTime?: number;
}

export interface DataMiningSession {
  id: string;
  computerId: string;
  startTime: number;
  duration: number; // milliseconds
  dataYield: number; // data units per second
  totalMined: number;
  active: boolean;
}

export interface LuxuryItem {
  id: string;
  name: string;
  brand: string;
  category: "fashion" | "jewelry" | "vehicle" | "property" | "tech";
  price: number; // Always expensive (10k+)
  prestigeBonus: number; // Status/prestige points
  description: string;
  unlockRequirement?: {
    type: "money" | "respect" | "data" | "mission";
    value: number | string;
  };
  owned: boolean;
}

export interface LuxuryShop {
  id: string;
  name: string;
  position: Vec3;
  items: LuxuryItem[];
  theme: "high-tech" | "fashion" | "automotive" | "real-estate";
  unlocked: boolean;
}

export interface PlayerInventory {
  computers: Computer[];
  dataMined: number; // Total data units collected
  luxuryItems: LuxuryItem[];
  prestige: number; // Status level from luxury items
}

export interface TrailVisualization {
  playerId: string;
  points: Vec3[];
  color: number;
  opacity: number;
  width: number;
}

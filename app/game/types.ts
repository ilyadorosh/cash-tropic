
// types.ts - Enhanced type system for AI-powered GTA

export interface GameStats {
  speed: string;
  health: number;
  mission: number;
  money: number;
  wanted: number;
  isCutscene: boolean;
  respect: number;
  relationship: number; // Girlfriend affection
}

export interface Dialogue {
  title: string;
  text: string;
  options?: DialogueOption[];
}

export interface DialogueOption {
  text: string;
  action: () => void;
  requirement?: () => boolean;
}

export interface Mission {
  id: string;
  pos: [number, number, number];
  name: string;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  dialogue: string[];
  reward: { money: number; respect: number };
  prerequisite?: string; // Mission ID that must be completed first
}

export interface NPCPersonality {
  name: string;
  role: "pedestrian" | "police" | "gang" | "story" | "girlfriend" | "merchant";
  systemPrompt: string;
  voicePitch: number;
  voiceRate: number;
  defaultLines: string[];
  memory: string[]; // Remembers past interactions
  affection?: number; // For relationship NPCs
  schedule?: NPCSchedule[];
}

export interface NPCSchedule {
  hour: number;
  location: [number, number, number];
  activity: string;
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
  relationships: Map<string, number>; // NPC ID -> affection
  lastAction: string;
  nextActionTime: number;
}

export interface Notification {
  id: string;
  type: "location" | "business" | "zone" | "money" | "mission";
  title: string;
  subtitle?: string;
  duration: number;
  startTime: number;
}
=======
// Game Types for Grand Thermodynamische Autobahn

// Position type for coordinates
export interface Position {
  x: number;
  y: number;
}

// Zone types for Nürnberg districts
export type ZoneType =
  | "suedstadt"
  | "innenstadt"
  | "gostenhof"
  | "nordstadt"
  | "weststadt"
  | "oststadt"
  | "langwasser";

// Road types
export type RoadType = "autobahn" | "hauptstrasse" | "nebenstrasse";

// Building types
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

// Mission categories
export type MissionCategory =
  | "physics"
  | "finance"
  | "health"
  | "spiritual"
  | "historical";

// Zone definition
export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  color: string;
  description?: string;
}

// Road definition
export interface Road {
  id: string;
  type: RoadType;
  points: Position[];
  width: number;
  name?: string;
}

// Building definition
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

// NPC dialogue
export interface NPCDialogue {
  id: string;
  text: string;
  responses?: {
    text: string;
    nextDialogueId?: string;
    action?: string;
  }[];
}

// NPC definition
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

// Mission objective
export interface MissionObjective {
  id: string;
  description: string;
  completed: boolean;
  targetPosition?: Position;
  targetNpcId?: string;
  targetBuildingId?: string;
}

// Mission definition
export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  stepNumber?: number; // For 12-step recovery quests
  objectives: MissionObjective[];
  reward?: {
    xp?: number;
    money?: number;
    item?: string;
  };
  prerequisites?: string[]; // Mission IDs that must be completed first
  unlocked: boolean;
  completed: boolean;
  startPosition?: Position;
  npcId?: string;
}

// Player trace point for multiplayer ghosts
export interface TracePoint {
  x: number;
  y: number;
  timestamp: number;
}

// Player trace
export interface PlayerTrace {
  id: string;
  playerId: string;
  playerName?: string;
  points: TracePoint[];
  startTime: number;
  endTime?: number;
  isHistorical?: boolean; // For historical figure traces
}

// Player state
export interface PlayerState {
  id: string;
  name: string;
  position: Position;
  health: number;
  money: number;
  xp: number;
  level: number;
  wantedLevel: number; // 0-5 stars like GTA
  currentMissionId?: string;
  completedMissions: string[];
  inventory: string[];
  lastSaveTime: number;
}

// Full map data
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

// Historical figures for Nürnberg
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

// Default spawn position (safe area)
export const DEFAULT_SPAWN_POSITION: Position = {
  x: 400,
  y: 300,
};

// Default map size
export const DEFAULT_MAP_SIZE = {
  width: 2000,
  height: 2000,
};
>>>>>>> copilot/add-map-editor-page

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

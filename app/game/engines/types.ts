// engines/types.ts - Core interfaces for the modular game engine system

import { PlayerProgress } from "../GameState";
import { GameStats, Dialogue, DialogueOption } from "../types";

/**
 * Engine type identifiers
 */
export type EngineType = "phaser2d" | "three3d" | "three4d";

/**
 * Map configuration identifiers
 */
export type MapType = "nuernberg" | "gta_sa" | "gta_vc" | "nyc" | "custom";

/**
 * Base configuration for any game engine
 */
export interface EngineConfig {
  engineType: EngineType;
  mapType: MapType;
  mapConfig?: MapConfig;
  features: EngineFeatures;
  locale?: string;
}

/**
 * Feature flags for engine capabilities
 */
export interface EngineFeatures {
  traffic: boolean;
  police: boolean;
  missions: boolean;
  interiors: boolean;
  weather: boolean;
  dayNightCycle: boolean;
  proceduralBuildings: boolean;
  llmDialogue: boolean;
}

/**
 * Map configuration - can be loaded from Redis or local config
 */
export interface MapConfig {
  id: string;
  name: string;
  locale: string;
  zones: ZoneConfig[];
  roads: RoadConfig[];
  landmarks: LandmarkConfig[];
  spawnPoints: SpawnPoint[];
  bounds: MapBounds;
}

export interface ZoneConfig {
  id: string;
  name: string;
  centerX: number;
  centerZ: number;
  radius: number;
  theme:
    | "residential"
    | "downtown"
    | "industrial"
    | "beach"
    | "slums"
    | "hills";
  unlocked: boolean;
  unlockRequirement?: {
    type: "money" | "respect" | "mission" | "relationship";
    value: number | string;
  };
}

export interface RoadConfig {
  id: string;
  name: string;
  type: "autobahn" | "hauptstrasse" | "strasse" | "alley";
  width: number;
  lanes: number;
  speedLimit: number;
  points: Array<{ x: number; z: number }>;
}

export interface LandmarkConfig {
  id: string;
  name: string;
  type:
    | "church"
    | "hospital"
    | "police"
    | "business"
    | "entertainment"
    | "safehouse";
  position: { x: number; y: number; z: number };
  rotation?: number;
  interactable: boolean;
  description?: string;
}

export interface SpawnPoint {
  id: string;
  type: "player" | "vehicle" | "npc" | "police";
  position: { x: number; y: number; z: number };
  rotation: number;
  default?: boolean;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Base interface for all game engines
 */
export interface IGameEngine {
  /**
   * Engine type identifier
   */
  readonly engineType: EngineType;

  /**
   * Initialize the engine with configuration
   */
  initialize(config: EngineConfig, container: HTMLElement): Promise<void>;

  /**
   * Load a map configuration
   */
  loadMap(mapConfig: MapConfig): Promise<void>;

  /**
   * Start the game loop
   */
  start(): void;

  /**
   * Pause the game
   */
  pause(): void;

  /**
   * Resume from pause
   */
  resume(): void;

  /**
   * Stop and cleanup
   */
  dispose(): void;

  /**
   * Get current game stats
   */
  getStats(): GameStats;

  /**
   * Set callback for dialogue events
   */
  onDialogue(callback: (dialogue: Dialogue) => void): void;

  /**
   * Set callback for notification events
   */
  onNotification(
    callback: (type: string, title: string, subtitle?: string) => void,
  ): void;

  /**
   * Set callback for stats updates
   */
  onStatsUpdate(callback: (stats: GameStats) => void): void;

  /**
   * Handle input from external sources (e.g., mobile controls)
   */
  handleInput(input: GameInput): void;

  /**
   * Load player progress
   */
  loadProgress(progress: PlayerProgress): void;

  /**
   * Get current player progress
   */
  getProgress(): PlayerProgress | null;
}

/**
 * Input types for cross-platform input handling
 */
export interface GameInput {
  type: "move" | "action" | "camera";
  data: MoveInput | ActionInput | CameraInput;
}

export interface MoveInput {
  x: number; // -1 to 1 for left/right
  y: number; // -1 to 1 for forward/back
  sprint?: boolean;
}

export interface ActionInput {
  action:
    | "interact"
    | "shoot"
    | "brake"
    | "enter_exit"
    | "mission_menu"
    | "pause";
}

export interface CameraInput {
  rotX: number;
  rotY: number;
  zoom?: number;
}

/**
 * Engine registry for managing multiple engine implementations
 */
export interface IEngineRegistry {
  /**
   * Register an engine implementation
   */
  register(type: EngineType, factory: EngineFactory): void;

  /**
   * Create an engine instance
   */
  create(type: EngineType): IGameEngine;

  /**
   * Get available engine types
   */
  getAvailableEngines(): EngineType[];

  /**
   * Check if an engine type is available
   */
  isAvailable(type: EngineType): boolean;
}

/**
 * Factory function type for creating engine instances
 */
export type EngineFactory = () => IGameEngine;

/**
 * Map loader interface for fetching map configurations
 */
export interface IMapLoader {
  /**
   * Load a map configuration by type
   */
  loadMap(mapType: MapType): Promise<MapConfig>;

  /**
   * Load a custom map by ID from Redis
   */
  loadCustomMap(mapId: string): Promise<MapConfig | null>;

  /**
   * List available maps
   */
  listMaps(): Promise<
    Array<{ type: MapType; name: string; available: boolean }>
  >;
}

/**
 * Default feature set for a standard engine
 */
export const DEFAULT_ENGINE_FEATURES: Readonly<EngineFeatures> = {
  traffic: true,
  police: true,
  missions: true,
  interiors: true,
  weather: false,
  dayNightCycle: false,
  proceduralBuildings: true,
  llmDialogue: true,
};

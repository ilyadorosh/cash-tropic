// engines/BaseEngine.ts - Abstract base class for game engines

import { PlayerProgress, createDefaultProgress } from "../GameState";
import { GameStats, Dialogue } from "../types";
import {
  EngineConfig,
  EngineFeatures,
  EngineType,
  IGameEngine,
  MapConfig,
  GameInput,
  DEFAULT_ENGINE_FEATURES,
} from "./types";

/**
 * Abstract base class that provides common functionality for all game engines.
 * Concrete implementations (Phaser2D, Three3D, etc.) should extend this class.
 */
export abstract class BaseEngine implements IGameEngine {
  abstract readonly engineType: EngineType;

  protected config: EngineConfig | null = null;
  protected mapConfig: MapConfig | null = null;
  protected container: HTMLElement | null = null;
  protected isRunning: boolean = false;
  protected isPaused: boolean = false;

  // Player state
  protected progress: PlayerProgress | null = null;
  protected stats: GameStats = {
    speed: "0",
    health: 100,
    mission: 0,
    money: 500,
    wanted: 0,
    isCutscene: false,
    respect: 0,
    relationship: 50,
  };

  // Callbacks
  protected dialogueCallback: ((dialogue: Dialogue) => void) | null = null;
  protected notificationCallback:
    | ((type: string, title: string, subtitle?: string) => void)
    | null = null;
  protected statsUpdateCallback: ((stats: GameStats) => void) | null = null;

  /**
   * Initialize the engine - to be implemented by subclasses
   */
  async initialize(
    config: EngineConfig,
    container: HTMLElement,
  ): Promise<void> {
    this.config = {
      ...config,
      features: { ...DEFAULT_ENGINE_FEATURES, ...config.features },
    };
    this.container = container;

    // Initialize progress if not loaded
    if (!this.progress) {
      this.progress = createDefaultProgress("player_1", "Player");
    }

    // Call subclass-specific initialization
    await this.onInitialize();
  }

  /**
   * Template method for subclass-specific initialization
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Load map configuration
   */
  async loadMap(mapConfig: MapConfig): Promise<void> {
    this.mapConfig = mapConfig;
    await this.onMapLoad(mapConfig);
  }

  /**
   * Template method for subclass-specific map loading
   */
  protected abstract onMapLoad(mapConfig: MapConfig): Promise<void>;

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.onStart();
  }

  /**
   * Template method for subclass-specific start logic
   */
  protected abstract onStart(): void;

  /**
   * Pause the game
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    this.onPause();
  }

  /**
   * Template method for subclass-specific pause logic
   */
  protected abstract onPause(): void;

  /**
   * Resume the game
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.onResume();
  }

  /**
   * Template method for subclass-specific resume logic
   */
  protected abstract onResume(): void;

  /**
   * Stop and cleanup
   */
  dispose(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.onDispose();
    this.container = null;
    this.config = null;
    this.mapConfig = null;
  }

  /**
   * Template method for subclass-specific cleanup
   */
  protected abstract onDispose(): void;

  /**
   * Get current game stats
   */
  getStats(): GameStats {
    return { ...this.stats };
  }

  /**
   * Update stats and notify listeners
   */
  protected updateStats(partial: Partial<GameStats>): void {
    this.stats = { ...this.stats, ...partial };
    this.statsUpdateCallback?.(this.stats);
  }

  /**
   * Show dialogue
   */
  protected showDialogue(dialogue: Dialogue): void {
    this.dialogueCallback?.(dialogue);
  }

  /**
   * Show notification
   */
  protected showNotification(
    type: string,
    title: string,
    subtitle?: string,
  ): void {
    this.notificationCallback?.(type, title, subtitle);
  }

  /**
   * Set dialogue callback
   */
  onDialogue(callback: (dialogue: Dialogue) => void): void {
    this.dialogueCallback = callback;
  }

  /**
   * Set notification callback
   */
  onNotification(
    callback: (type: string, title: string, subtitle?: string) => void,
  ): void {
    this.notificationCallback = callback;
  }

  /**
   * Set stats update callback
   */
  onStatsUpdate(callback: (stats: GameStats) => void): void {
    this.statsUpdateCallback = callback;
  }

  /**
   * Handle input from external sources
   */
  abstract handleInput(input: GameInput): void;

  /**
   * Load player progress
   */
  loadProgress(progress: PlayerProgress): void {
    this.progress = progress;
    this.stats.money = progress.money;
    this.stats.health = progress.health;
    this.stats.wanted = progress.wantedLevel;
    this.stats.respect = progress.respect;
  }

  /**
   * Get current player progress
   */
  getProgress(): PlayerProgress | null {
    return this.progress;
  }

  /**
   * Utility: Check if a feature is enabled
   */
  protected hasFeature(feature: keyof EngineFeatures): boolean {
    return this.config?.features[feature] ?? false;
  }

  /**
   * Utility: Get map bounds
   */
  protected getMapBounds(): {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  } | null {
    return this.mapConfig?.bounds ?? null;
  }
}

// engines/index.ts - Public API for the modular engine system

// Core types
export type {
  EngineType,
  MapType,
  EngineConfig,
  EngineFeatures,
  MapConfig,
  ZoneConfig,
  RoadConfig,
  LandmarkConfig,
  SpawnPoint,
  MapBounds,
  IGameEngine,
  IEngineRegistry,
  IMapLoader,
  GameInput,
  MoveInput,
  ActionInput,
  CameraInput,
  EngineFactory,
} from "./types";

export { DEFAULT_ENGINE_FEATURES } from "./types";

// Base engine class
export { BaseEngine } from "./BaseEngine";

// Engine registry
export { EngineRegistry, RegisterEngine } from "./EngineRegistry";

// Map loader
export { MapLoader, defaultMapLoader } from "./MapLoader";

// Engine implementations
export { Three3DEngine } from "./Three3DEngine";

// React wrapper
export { GameEngineWrapper } from "./GameEngineWrapper";
export type { GameEngineWrapperProps } from "./GameEngineWrapper";

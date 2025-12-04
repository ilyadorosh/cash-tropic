// engines/EngineRegistry.ts - Registry for managing engine implementations

import {
  EngineType,
  IEngineRegistry,
  IGameEngine,
  EngineFactory,
} from "./types";

/**
 * Singleton registry for game engine implementations.
 * Allows registering and creating different engine types.
 */
class EngineRegistryImpl implements IEngineRegistry {
  private static instance: EngineRegistryImpl;
  private factories: Map<EngineType, EngineFactory> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): EngineRegistryImpl {
    if (!EngineRegistryImpl.instance) {
      EngineRegistryImpl.instance = new EngineRegistryImpl();
    }
    return EngineRegistryImpl.instance;
  }

  /**
   * Register an engine factory
   */
  register(type: EngineType, factory: EngineFactory): void {
    if (this.factories.has(type)) {
      console.warn(`Engine type "${type}" is already registered. Overwriting.`);
    }
    this.factories.set(type, factory);
    console.log(`✅ Registered engine: ${type}`);
  }

  /**
   * Create an engine instance
   */
  create(type: EngineType): IGameEngine {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(
        `Engine type "${type}" is not registered. Available: ${this.getAvailableEngines().join(
          ", ",
        )}`,
      );
    }
    return factory();
  }

  /**
   * Get list of available engine types
   */
  getAvailableEngines(): EngineType[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Check if an engine type is available
   */
  isAvailable(type: EngineType): boolean {
    return this.factories.has(type);
  }

  /**
   * Unregister an engine (useful for testing)
   */
  unregister(type: EngineType): boolean {
    return this.factories.delete(type);
  }

  /**
   * Clear all registered engines (useful for testing)
   */
  clear(): void {
    this.factories.clear();
  }
}

/**
 * Export the singleton instance
 */
export const EngineRegistry = EngineRegistryImpl.getInstance();

/**
 * Decorator for auto-registering engine classes
 * Usage: @RegisterEngine("three3d")
 */
export function RegisterEngine(type: EngineType) {
  return function <T extends { new (): IGameEngine }>(constructor: T) {
    EngineRegistry.register(type, () => new constructor());
    return constructor;
  };
}

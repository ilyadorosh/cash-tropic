# Modular Game Engine Architecture

This document describes the modular game engine system that supports multiple rendering engines (2D, 3D, 4D) and configurable city maps.

## Overview

The engine system provides:

- **Modular Engine Interface**: A common interface (`IGameEngine`) that different rendering engines implement
- **Engine Registry**: A central registry for registering and creating engine instances
- **Map Configuration System**: Configurable maps that can be loaded from built-in presets or Redis
- **React Wrapper**: A React component for easy integration

## Architecture

```
app/game/engines/
├── types.ts              # Core interfaces and types
├── BaseEngine.ts         # Abstract base class for engines
├── EngineRegistry.ts     # Engine registration and creation
├── MapLoader.ts          # Map configuration loading
├── Three3DEngine.ts      # Three.js 3D implementation (stub)
├── GameEngineWrapper.tsx # React wrapper component
└── index.ts              # Public exports
```

## Engine Types

The system supports three engine types:

| Type | Description | Status |
|------|-------------|--------|
| `phaser2d` | 2D Phaser.js engine | Planned |
| `three3d` | 3D Three.js engine | Implemented (stub) |
| `three4d` | 4D Three.js with time manipulation | Planned |

## Map Types

Built-in map configurations:

| Type | Location | Locale |
|------|----------|--------|
| `nuernberg` | Nürnberg, Deutschland | de-DE |
| `gta_sa` | Los Santos, San Andreas | en-US |
| `gta_vc` | Vice City | en-US |
| `nyc` | Liberty City (NYC Style) | en-US |
| `custom` | User-defined (via Redis) | Configurable |

## Usage

### Basic Usage

```tsx
import { GameEngineWrapper } from '@/app/game/engines';

function GamePage() {
  return (
    <GameEngineWrapper
      engineType="three3d"
      mapType="nuernberg"
      onReady={() => console.log('Game loaded!')}
    />
  );
}
```

### With Custom Map

```tsx
<GameEngineWrapper
  engineType="three3d"
  mapType="custom"
  customMapId="my-custom-map"
/>
```

### Direct Engine API

```typescript
import { EngineRegistry, defaultMapLoader, Three3DEngine } from '@/app/game/engines';

// Register engine
EngineRegistry.register('three3d', () => new Three3DEngine());

// Create engine instance
const engine = EngineRegistry.create('three3d');

// Initialize
await engine.initialize({
  engineType: 'three3d',
  mapType: 'nuernberg',
  features: {
    traffic: true,
    police: true,
    missions: true,
    interiors: true,
    weather: false,
    dayNightCycle: false,
    proceduralBuildings: true,
    llmDialogue: true,
  }
}, containerElement);

// Load map
const mapConfig = await defaultMapLoader.loadMap('nuernberg');
await engine.loadMap(mapConfig);

// Start game
engine.start();

// Handle input
engine.handleInput({
  type: 'move',
  data: { x: 0, y: 1, sprint: false }
});

// Cleanup
engine.dispose();
```

## Map Configuration

Map configurations define the game world:

```typescript
interface MapConfig {
  id: string;
  name: string;
  locale: string;
  zones: ZoneConfig[];      // City zones with themes
  roads: RoadConfig[];      // Road network
  landmarks: LandmarkConfig[]; // Key locations
  spawnPoints: SpawnPoint[]; // Player/vehicle spawn locations
  bounds: MapBounds;        // World boundaries
}
```

### Zone Configuration

```typescript
interface ZoneConfig {
  id: string;
  name: string;
  centerX: number;
  centerZ: number;
  radius: number;
  theme: 'residential' | 'downtown' | 'industrial' | 'beach' | 'slums' | 'hills';
  unlocked: boolean;
  unlockRequirement?: {
    type: 'money' | 'respect' | 'mission' | 'relationship';
    value: number | string;
  };
}
```

## Custom Maps via Redis

Custom maps are stored in Redis and accessed through server-side API routes
(for security - credentials are not exposed to the client).

```typescript
import { defaultMapLoader } from '@/app/game/engines';

// Load custom map (fetches from /api/game/map)
const customMap = await defaultMapLoader.loadCustomMap('my-map-id');

// Save custom map (posts to /api/game/map)
await defaultMapLoader.saveCustomMap(myMapConfig);

// List available maps
const maps = await defaultMapLoader.listMaps();
```

### Server-side API Route

Create `/api/game/map/route.ts` to handle custom map operations:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mapId = searchParams.get('id');
  
  if (!mapId) {
    return Response.json({ error: 'Map ID required' }, { status: 400 });
  }
  
  const mapConfig = await redis.get(`map:${mapId}`);
  return Response.json({ mapConfig });
}

export async function POST(request: Request) {
  const { mapConfig } = await request.json();
  await redis.set(`map:${mapConfig.id}`, mapConfig);
  return Response.json({ success: true });
}
```

## Implementing New Engines

To add a new engine type:

1. Extend the `BaseEngine` class
2. Implement required abstract methods
3. Register the engine

```typescript
import { BaseEngine, EngineType, MapConfig, GameInput } from './engines';

class Phaser2DEngine extends BaseEngine {
  readonly engineType: EngineType = 'phaser2d';

  protected async onInitialize(): Promise<void> {
    // Phaser initialization
  }

  protected async onMapLoad(mapConfig: MapConfig): Promise<void> {
    // Load map into Phaser
  }

  protected onStart(): void {
    // Start game loop
  }

  protected onPause(): void {
    // Pause
  }

  protected onResume(): void {
    // Resume
  }

  protected onDispose(): void {
    // Cleanup
  }

  handleInput(input: GameInput): void {
    // Handle input
  }
}

// Register
EngineRegistry.register('phaser2d', () => new Phaser2DEngine());
```

## Feature Flags

Control engine capabilities:

```typescript
interface EngineFeatures {
  traffic: boolean;         // Traffic system
  police: boolean;          // Police AI
  missions: boolean;        // Mission system
  interiors: boolean;       // Building interiors
  weather: boolean;         // Weather effects
  dayNightCycle: boolean;   // Time of day
  proceduralBuildings: boolean; // LLM building generation
  llmDialogue: boolean;     // LLM NPC dialogue
}
```

## Future Extensions

### Country/Language Variants

Different countries can be supported via:

1. Custom maps with localized zone/landmark names
2. Locale-specific dialogue systems
3. Region-specific features (e.g., autobahn in Germany, highways in US)

### Phaser 2D Engine

A 2D top-down engine using Phaser.js:

- Retro GTA 1/2 style
- Better mobile performance
- Simpler asset requirements

### Three.js 4D Engine

Extended 3D engine with time manipulation:

- Time rewind mechanics
- Parallel timeline missions
- Past/future world states

## Related Files

- `app/game/Engine.tsx` - Original monolithic 3D engine (being refactored)
- `app/game/NuernbergMap.ts` - Nürnberg-specific map data
- `app/game/ProceduralCity.ts` - Procedural building generation
- `app/game/GameManager.ts` - Save/load game state

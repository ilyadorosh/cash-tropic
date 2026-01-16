# New Gameplay Features Documentation

## Overview
This document describes the new gameplay mechanics added to the Cash Tropic 3D game, making it more addictive through Redis-backed map rendering, player trails, computer collection, data mining, and luxury brand systems.

## Features Implemented

### 1. Redis-Backed Map System

**Purpose**: Dynamic map loading and player-driven world changes stored in Redis.

**Components**:
- `RedisMapLoader.ts` - Service for loading/saving map data
- `/api/game/map/route.ts` - Existing map API endpoint
- `/api/game/trail/route.ts` - New trail storage endpoint
- `/api/game/map/modification/route.ts` - Map modification tracking

**Usage**:
- Map data is automatically loaded from Redis on game start
- Falls back to default Nürnberg map if Redis is unavailable
- All player actions are tracked and can modify the world state

**Configuration**:
Set these environment variables in `.env.local`:
```bash
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 2. Player Trail System

**Purpose**: Visualize player movement and create persistent impact on the game world.

**Components**:
- `TrailRenderer.ts` - 3D trail visualization
- Automatic trail recording every 2 seconds
- Auto-save to Redis every 30 seconds
- Trail persistence for 5 minutes (configurable)

**Features**:
- Real-time 3D trail rendering with fade effect
- Action markers for special events (computer collection, purchases)
- Multi-player trail support (can view other players' paths)
- Efficient storage with 500-point limit per player

**Visual Indicators**:
- Green glowing trail follows player movement
- Special markers appear for:
  - 🔵 Computer collection (blue)
  - 🟣 Data mining (purple)
  - 🟠 Luxury purchases (orange)

### 3. Computer Collection Mechanic

**Purpose**: Collectible items that provide mining power and cash rewards.

**Computer Types**:
1. **Laptop** (€2,500, 10 mining power)
   - MacBook Pro, ThinkPad X1
2. **Desktop** (€3,500-4,000, 25-30 mining power)
   - Alienware, Custom Gaming Rig
3. **Server** (€15,000, 100 mining power)
   - Dell PowerEdge
4. **Supercomputer** (€500,000, 1,000 mining power)
   - IBM Summit

**Locations**: 6 computers spawned across Nürnberg map:
- Check HUD for "💻 Computers" counter
- Look for glowing, floating colored boxes
- Walk within 5 units to collect

**Collection Rewards**:
- Instant cash reward (computer value)
- Increases total mining power
- Automatically starts 2-minute mining session
- Notification with details

### 4. Data Mining Gameplay Loop

**Purpose**: Passive income system based on collected computers.

**Mechanics**:
- Each computer contributes mining power
- Mining sessions run automatically (2 minutes default)
- Data accumulates in real-time
- Shown as "📊 Data Mined: X units (+Y/s)"

**Mining Power Calculation**:
- Data per second = Computer Mining Power / 10
- Example: Laptop (10 power) = 1 data/second
- Multiple computers stack their power

**Data Usage**:
- Required for certain luxury items
- Trade for prestige points
- Unlock exclusive content

### 5. Luxury Brand System

**Purpose**: High-end, expensive items that provide prestige and status.

**Luxury Items** (8 total):

| Item | Category | Price | Prestige | Unlock Requirement |
|------|----------|-------|----------|-------------------|
| Rolex Submariner | Jewelry | €25,000 | +50 | None |
| Gucci Designer Suit | Fashion | €15,000 | +35 | None |
| MacBook Pro M3 Max | Tech | €8,000 | +25 | None |
| Cartier Love Bracelet | Jewelry | €12,000 | +30 | None |
| Louis Vuitton Trunk | Fashion | €28,000 | +60 | None |
| 3-Carat Diamond Ring | Jewelry | €45,000 | +80 | 1,000 data units |
| Porsche 911 GT3 | Vehicle | €180,000 | +150 | 100 respect |
| Innenstadt Penthouse | Property | €850,000 | +300 | 200 respect |

**Luxury Shops** (5 locations):

1. **TechLux Boutique** (75, -75) - Tech items
2. **Königstraße Fashion** (-90, -55) - Fashion items
3. **Diamanten & Uhren** (45, -120) - Jewelry
4. **Prestige Motors** (320, -80) - Vehicles (unlock required)
5. **Elite Properties** (-150, -90) - Real estate (unlock required)

**Shopping**:
1. Walk near a luxury shop (gold-colored building)
2. Press **L** key when prompted
3. Browse up to 3 items at a time
4. Press **1**, **2**, or **3** to purchase
5. Confirm you meet requirements (money, respect, data)

**Prestige System**:
- Accumulates from luxury purchases
- Displayed as "⭐ Prestige: X"
- Higher prestige may unlock special content
- Visible status symbol

## Controls

### New Keyboard Controls:
- **L** - Open nearby luxury shop
- Walk near computers to auto-collect
- Existing controls remain unchanged

### HUD Display:
New stats panel shows:
```
💻 Computers: X
📊 Data Mined: X units (+X/s)
⭐ Prestige: X
```

## Technical Architecture

### File Structure:
```
app/game/
├── RedisMapLoader.ts        # Map data management
├── TrailRenderer.ts          # 3D trail visualization
├── GameplayMechanics.ts      # Core gameplay systems
├── Engine3D.tsx              # Main integration
├── types.ts                  # Type definitions
└── GameState.ts              # Player state management

app/api/game/
├── trail/route.ts            # Trail persistence
└── map/modification/route.ts # Map changes tracking
```

### Data Flow:
1. **Map Loading**: Redis → RedisMapLoader → Engine3D
2. **Trail Recording**: Player Movement → TrailRenderer → Redis
3. **Computer Collection**: Collision Check → GameplayManager → State Update
4. **Data Mining**: Active Sessions → deltaTime Update → State
5. **Luxury Purchase**: Shop Interaction → Validation → State Update

## Redis Data Structure

### Keys Used:
- `game:map` - Main map data
- `game:trail:{playerId}` - Player trail points (7 day TTL)
- `game:map_mod:{gridX}_{gridZ}` - Map modifications (30 day TTL)

### Trail Point Format:
```typescript
{
  x: number,
  z: number,
  timestamp: number,
  playerId: string,
  action?: string
}
```

### Map Modification Format:
```typescript
{
  x: number,
  z: number,
  type: string,
  data: any,
  playerId: string,
  timestamp: number
}
```

## Performance Considerations

- Trail points limited to 500 per player
- Trails auto-fade after 5 minutes
- Map modifications stored in 100x100 unit grid cells
- Maximum 100 modifications per grid cell
- Computer animations use requestAnimationFrame
- Mining calculations run per-frame with deltaTime

## Fallback Behavior

When Redis is unavailable:
- Uses default Nürnberg map
- Trails cached locally (lost on refresh)
- Map modifications not persisted
- All gameplay still functional

## Future Enhancements

Potential additions:
- [ ] Multiplayer trail visualization
- [ ] Trading system for luxury items
- [ ] Leaderboards for prestige
- [ ] Dynamic computer spawn rates
- [ ] Luxury item showcase/display
- [ ] Data marketplace
- [ ] Prestige-based unlocks

## Troubleshooting

**Computers not appearing**:
- Check console for GameplayManager initialization
- Verify scene setup completed

**Trails not rendering**:
- Check TrailRenderer initialization in Engine3D
- Verify trail points being recorded (console logs)

**Luxury shops not interactive**:
- Walk closer to gold-colored buildings
- Press L (not lowercase l)
- Check shop is unlocked (some require respect)

**Data mining not working**:
- Collect at least one computer first
- Check active mining sessions in console
- Verify deltaTime updates running

## Code Review Notes

All new code follows existing patterns:
- TypeScript strict mode compatible
- ESLint compliant
- Consistent with existing game architecture
- Modular and maintainable structure
- Comprehensive error handling
- Redis fallback implemented

## Testing Checklist

- [x] TypeScript compilation passes
- [x] ESLint checks pass
- [x] Build completes successfully
- [ ] Manual gameplay testing
- [ ] Redis integration testing
- [ ] Fallback behavior verification
- [ ] Performance profiling

## Credits

Implemented as part of the Cash Tropic gameplay enhancement project.

# 4D GTA Implementation Guide

## Architecture Overview

We've implemented a **hybrid approach** combining:
1. **True 4D projection** (mathematical 4D→3D transformation)
2. **Slicing** (discrete W layers for gameplay and performance)
3. **Cross-section visualization** (objects grow/shrink as you move through W)

## Files Created

### Core Math: `app/game/HyperMath.ts`
- `Vec4` type and operations (add, sub, scale, normalize, dot, lerp)
- `project4Dto3D()` - True 4D perspective projection with rotation support
- `getHypershapeSlice()` - Calculate 3D cross-section at a W slice
- `rotate4D()` - 4D rotation in XW, ZW, YW planes
- Tesseract/16-cell/5-cell vertex generators
- 4D collision helpers

### Controls: `app/game/Controls4D.tsx`
- `useControls4D()` hook - Keyboard WASD + Q/E for W axis
- `Controls4DOverlay` - Mobile W+/W- buttons
- `SliceSelector` - Quick-jump between W slices
- `TouchJoystick4D` - Mobile touch controls

### Engine Integration: `app/game/Engine4DIntegration.ts`
- `Entity4D` interface with 4D position/velocity
- `updateEntityMeshFrom4D()` - Position + opacity based on W distance
- `updateEntityMeshWithSlicing()` - True cross-section scaling
- `createTesseractMesh()` - Animated 4D hypercube wireframe
- `SliceManager` - Manage discrete W layers
- Ghost trace system for multiplayer

### MiniMap: `app/game/MiniMap4D.tsx`
- `MiniMap4D` - X-W side view (W as vertical axis)
- `MiniMapTopDown4D` - Top-down with W as opacity
- `WLayerBar` - W position indicator

## Current Implementation in `app/4d/page.tsx`

The 4D driving game already implements:

```typescript
// True 4D slicing
function getHypercubeSlice(objW, objWExtent, playerW) {
  const relW = playerW - objW;
  if (Math.abs(relW) > objWExtent) return { visible: false, scale: 0 };
  const scale = Math.sqrt(1 - (relW/objWExtent)²);  // Hypersphere formula
  return { visible: true, scale };
}

// Objects include:
- Hypercubes (tesseracts) with inner cube showing 4D depth
- Hyperspheres that grow/shrink as you pass through
- Platforms with W extent
- Buildings with W extent
- All collisions use slice-aware bounds
```

## Integration with Main Engine

### Phase 1: Add W Coordinate to Entities

```typescript
// In Engine.tsx, change position types:
interface Entity {
  id: string;
  pos: Vec4;  // was { x, y, z }
  // ...
}

// Or keep 3D positions and add W separately:
interface Entity3D {
  position: THREE.Vector3;
  w: number;
  wExtent: number;  // How thick in W dimension
}
```

### Phase 2: Add W-Aware Rendering

```typescript
// In your render loop:
entities.forEach(entity => {
  const slice = getHypershapeSlice(entity.w, entity.wExtent, playerW);
  if (!slice.visible) {
    entity.mesh.visible = false;
    return;
  }
  entity.mesh.visible = true;
  entity.mesh.scale.set(slice.scale, 1, slice.scale);
  entity.mesh.material.opacity = slice.opacity;
});
```

### Phase 3: Add W Navigation

```typescript
// Q/E controls
if (keys['q']) playerW -= 0.1;
if (keys['e']) playerW += 0.1;

// Or discrete slice jumping
if (keys['q'] && !wasPressed) playerW = Math.round(playerW - 10);
if (keys['e'] && !wasPressed) playerW = Math.round(playerW + 10);
```

### Phase 4: W-Aware Collisions

```typescript
function checkCollision(player: Vec4, object: { pos: Vec4, size: Vec4 }) {
  // Check W first for early exit
  const wDist = Math.abs(player.w - object.pos.w);
  if (wDist > object.size.w) return false;
  
  // Then check XYZ (scaled by W slice)
  const slice = getHypershapeSlice(object.pos.w, object.size.w, player.w);
  const scaledSizeX = object.size.x * slice.scale;
  // ... etc
}
```

## Gameplay Design

### Slice-Based Design (Recommended Start)
- W=0: Main city (always loaded)
- W=10: "Blue district" - special missions
- W=-10: "Pink district" - alternate reality
- Portals/ramps to transition between

### Continuous W Design (More Complex)
- Objects exist with W extent (e.g., building from W=-5 to W=5)
- Player can smoothly drive through W
- See cross-sections of everything

### Hybrid (What we have in /4d)
- Continuous movement + discrete significant slices
- Objects grow/shrink smoothly
- Still playable and performant

## Performance Considerations

1. **Culling**: Only render objects within ±N W of player
2. **LOD**: Reduce geometry for distant W objects
3. **Instancing**: Use instanced meshes for repeated buildings
4. **Slice Loading**: Load/unload slice content dynamically

## Multiplayer (Redis Integration)

```typescript
// Store traces with W coordinate
interface PlayerTrace {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  timestamp: number;
}

// Show ghosts from same/nearby W slices
const nearbyTraces = traces.filter(t => 
  Math.abs(t.w - playerW) < 5
);
```

## Next Steps

1. **Test /4d page** - Drive around, experience true 4D slicing
2. **Port to Engine.tsx** - Add W to existing entities incrementally
3. **Add slice HUD** - Show current W, nearby slices
4. **Add portals** - Controlled W transitions
5. **Neural CA per slice** - Run NCA on GPU for each W layer

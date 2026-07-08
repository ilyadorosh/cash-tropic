# NCA in the browser, in the game

A trained neural cellular automaton (NCA) runs client-side on the GPU and
appears in four places. Same weights everywhere; the local update rule lives
in a WebGL2 fragment shader, every cell in parallel.

## The pipeline

1. Train in the notebook, export `nca_weights.json` (16 channels; meta:
   `SIZE`, `HID`, `IN`, `COND`, `N` classes, `fire_rate`).
2. `python3 scripts/quantize-nca.py` → `public/nca_weights.q16.json`
   (uint16 + per-array min/max, base64; 448 KB → 56 KB, max err ~3e-5).
3. `app/nca/player/engine.ts` — the shared runtime:
   - `fetchWeights()` loads q16 first, raw fallback; `normalizeWeights()`
     dequantizes.
   - `createPlayer(canvas, onErr, onStat, { preserveDrawingBuffer })` builds
     the shader pipeline (ping-pong RGBA32F state textures, 4 MRT outputs).
   - `loadModel(weights, opts)` — `opts` is the interesting part:
     - `gridSize`: run the rule on a *bigger world than trained*. NCAs are
       translation-invariant, so a 56×56-trained organism runs on 96, 128, …
     - `seeds`: N initial life points (organisms grow into each other).
     - `background`: dead-cell color ("#000000" + alphaTest = cutout).
     - `canvasScale`: pixels per cell.
   - `params.stepEvery`: sim every Nth frame (weak-GPU knob, e.g. MX250).
   - `damageAtCell(x, y, r)`: wound the substrate; it heals — this is
     gameplay for free (NCA regeneration = boss mechanic).

## Where it lives

| Surface | How |
|---|---|
| `/nca/player` | full lab: classes, A→B morph, fire rate, poke-to-damage |
| homepage tama | 56×56 in the egg screen, idle-deferred so first paint never waits |
| `/game` 2D (Phaser) | BLØB the creature: WebGL canvas → 2D mirror canvas → `textures.addCanvas` + `refresh()` per frame (Phaser needs a 2D canvas; WebGL canvases need `preserveDrawingBuffer: true` to be mirrored) |
| `/game` 3D (three.js) | **the living terrain**: 96×96 NCA → `THREE.CanvasTexture` used as `map` + `displacementMap` + `alphaMap` on a 300×300 `PlaneGeometry(…, 96, 96)`. Brightness = height → organisms literally rise out of the city. `tex.needsUpdate` every 3rd frame |

## Why this is interesting (the paper angle)

- A neural network as *world*, not NPC: the environment itself computes.
- Damage/heal is an interactive robustness experiment — players run
  perturbation studies by playing.
- Scale-free deployment: train small, run big (translation invariance).
- Runs on integrated GPUs in a browser tab: 16 channels × 128² at 30 steps/s
  is ~tamagotchi-cost with `stepEvery: 2`.

Cost model per cell per step: ~`HID × (IN + 9)` texel fetches
(HID 256, IN 64 → ~18.7k). Budget grid size accordingly:
cells × steps/s × 18.7k ≈ fetches/s; keep under ~1G on an MX250.

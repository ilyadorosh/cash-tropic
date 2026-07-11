// engine.ts — pure light-cycle logic. No DOM, no React: a state machine you
// tick. The whole Tron loop is here: ride, leave a wall, don't hit anything,
// outlive the programs. AI riders steer by space-maximization (flood fill)
// tempered by aggression (cutting you off), so their skill is two numbers —
// which is exactly what lets match history tune them between sessions.

export const GRID_W = 100;
export const GRID_H = 72;

export type Dir = 0 | 1 | 2 | 3; // N E S W
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

export interface Rider {
  name: string;
  color: string;
  x: number;
  y: number;
  dir: Dir;
  alive: boolean;
  isPlayer: boolean;
  /** path of visited cells, for rendering the wall */
  trail: Array<[number, number]>;
  /** 0..1 — how strongly it steers toward cutting the player off */
  aggression: number;
  /** flood-fill budget: how far ahead it can "see" open space */
  sight: number;
  derezAt?: [number, number];
}

export type Phase =
  | "attract"
  | "countdown"
  | "running"
  | "roundOver"
  | "matchOver";

export interface TronState {
  phase: Phase;
  /** cell occupancy: 0 = empty, i+1 = rider i's wall */
  walls: Uint8Array;
  riders: Rider[];
  round: number;
  playerScore: number;
  aiScore: number;
  tick: number;
  countdown: number;
  /** ticks the player survived this round (for the profile) */
  survival: number;
  leftTurns: number;
  rightTurns: number;
  targetScore: number;
  lastDerez: string | null;
}

export interface OpponentTuning {
  aggression: number;
  sight: number;
}

const inBounds = (x: number, y: number) =>
  x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
const idx = (x: number, y: number) => y * GRID_W + x;

export function createMatch(tuning: OpponentTuning): TronState {
  const state: TronState = {
    phase: "countdown",
    walls: new Uint8Array(GRID_W * GRID_H),
    riders: [],
    round: 1,
    playerScore: 0,
    aiScore: 0,
    tick: 0,
    countdown: 3,
    survival: 0,
    leftTurns: 0,
    rightTurns: 0,
    targetScore: 3,
    lastDerez: null,
  };
  resetRound(state, tuning);
  return state;
}

export function resetRound(state: TronState, tuning: OpponentTuning) {
  state.walls.fill(0);
  const cy = Math.floor(GRID_H / 2);
  state.riders = [
    {
      name: "USER",
      color: "#8ef7ff",
      x: 8,
      y: cy,
      dir: 1,
      alive: true,
      isPlayer: true,
      trail: [[8, cy]],
      aggression: 0,
      sight: 0,
    },
    {
      name: "VEX",
      color: "#ff9a3c",
      x: GRID_W - 9,
      y: cy - 12,
      dir: 3,
      alive: true,
      isPlayer: false,
      trail: [[GRID_W - 9, cy - 12]],
      aggression: tuning.aggression,
      sight: tuning.sight,
    },
    {
      name: "AXIOM",
      color: "#ffd23c",
      x: GRID_W - 9,
      y: cy + 12,
      dir: 3,
      alive: true,
      isPlayer: false,
      trail: [[GRID_W - 9, cy + 12]],
      aggression: Math.max(0.1, tuning.aggression - 0.25),
      sight: tuning.sight + 120,
    },
  ];
  for (const [i, r] of state.riders.entries())
    state.walls[idx(r.x, r.y)] = i + 1;
  state.tick = 0;
  state.survival = 0;
  state.countdown = 3;
  state.phase = "countdown";
  state.lastDerez = null;
}

/** relative turn from the player's seat: -1 left, +1 right */
export function turnPlayer(state: TronState, turn: -1 | 1) {
  const p = state.riders[0];
  if (!p.alive || state.phase !== "running") return;
  p.dir = ((p.dir + turn + 4) % 4) as Dir;
  if (turn < 0) state.leftTurns++;
  else state.rightTurns++;
}

/** absolute steering (arrow keys): ignored if it would reverse into the wall */
export function steerPlayer(state: TronState, dir: Dir) {
  const p = state.riders[0];
  if (!p.alive || state.phase !== "running") return;
  if ((dir + 2) % 4 === p.dir || dir === p.dir) return;
  const delta = (dir - p.dir + 4) % 4;
  if (delta === 1) state.rightTurns++;
  else state.leftTurns++;
  p.dir = dir;
}

// how much open space a rider would reach from (x, y) — capped BFS
function floodRoom(
  walls: Uint8Array,
  x: number,
  y: number,
  cap: number,
): number {
  if (!inBounds(x, y) || walls[idx(x, y)]) return 0;
  const seen = new Set<number>([idx(x, y)]);
  const queue = [idx(x, y)];
  let count = 0;
  while (queue.length && count < cap) {
    const cell = queue.pop()!;
    count++;
    const cx = cell % GRID_W;
    const cy = (cell / GRID_W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + DX[d];
      const ny = cy + DY[d];
      const ni = idx(nx, ny);
      if (inBounds(nx, ny) && !walls[ni] && !seen.has(ni)) {
        seen.add(ni);
        queue.push(ni);
      }
    }
  }
  return count;
}

function steerAI(state: TronState, rider: Rider) {
  const player = state.riders[0];
  let bestDir = rider.dir;
  let bestScore = -Infinity;
  for (const delta of [0, 3, 1]) {
    // straight, left, right — straight first so ties don't wiggle
    const dir = ((rider.dir + delta) % 4) as Dir;
    const nx = rider.x + DX[dir];
    const ny = rider.y + DY[dir];
    if (!inBounds(nx, ny) || state.walls[idx(nx, ny)]) continue;
    const room = floodRoom(state.walls, nx, ny, rider.sight);
    let score = room;
    if (player.alive && rider.aggression > 0) {
      // chase the cell three ahead of the player: cut-off, not tailgating
      const tx = player.x + DX[player.dir] * 3;
      const ty = player.y + DY[player.dir] * 3;
      const dist = Math.abs(nx - tx) + Math.abs(ny - ty);
      score -= dist * rider.aggression * 6;
    }
    if (score > bestScore) {
      bestScore = score;
      bestDir = dir;
    }
  }
  rider.dir = bestDir;
}

export interface TickEvents {
  derezzed: Rider[];
  roundOver: boolean;
  matchOver: boolean;
  playerWonRound: boolean | null;
}

export function tick(state: TronState): TickEvents {
  const events: TickEvents = {
    derezzed: [],
    roundOver: false,
    matchOver: false,
    playerWonRound: null,
  };
  if (state.phase !== "running") return events;
  state.tick++;
  if (state.riders[0].alive) state.survival++;

  for (const rider of state.riders) {
    if (!rider.alive || rider.isPlayer) continue;
    steerAI(state, rider);
  }

  // move everyone, then judge: simultaneous, so head-swaps derez both
  const nextPos = state.riders.map((r) =>
    r.alive ? ([r.x + DX[r.dir], r.y + DY[r.dir]] as [number, number]) : null,
  );
  state.riders.forEach((rider, i) => {
    const pos = nextPos[i];
    if (!rider.alive || !pos) return;
    const [nx, ny] = pos;
    const hitWall = !inBounds(nx, ny) || state.walls[idx(nx, ny)] !== 0;
    const headOn = nextPos.some(
      (other, j) => j !== i && other && other[0] === nx && other[1] === ny,
    );
    if (hitWall || headOn) {
      rider.alive = false;
      rider.derezAt = [rider.x, rider.y];
      events.derezzed.push(rider);
    }
  });
  for (const [i, rider] of state.riders.entries()) {
    const pos = nextPos[i];
    if (!rider.alive || !pos) continue;
    rider.x = pos[0];
    rider.y = pos[1];
    state.walls[idx(rider.x, rider.y)] = i + 1;
    rider.trail.push([rider.x, rider.y]);
  }
  if (events.derezzed.length > 0) {
    state.lastDerez = events.derezzed[events.derezzed.length - 1].name;
  }

  const playerAlive = state.riders[0].alive;
  const aiAlive = state.riders.some((r) => !r.isPlayer && r.alive);
  if (!playerAlive || !aiAlive) {
    events.roundOver = true;
    state.phase = "roundOver";
    if (playerAlive && !aiAlive) {
      state.playerScore++;
      events.playerWonRound = true;
    } else if (!playerAlive && aiAlive) {
      state.aiScore++;
      events.playerWonRound = false;
    }
    // both gone same tick: draw, no score
    if (
      state.playerScore >= state.targetScore ||
      state.aiScore >= state.targetScore
    ) {
      state.phase = "matchOver";
      events.matchOver = true;
    }
  }
  return events;
}

// CityLayout.ts - Ordered city grid system for Nürnberg

import { ROADS } from "./NuernbergMap";

export interface StreetSegment {
  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  width: number;
  type: "main" | "side" | "alley";
  name: string;
}

export interface CityBlock {
  id: string;
  zone: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  plots: BuildingPlot[];
}

export interface BuildingPlot {
  id: string;
  blockId: string;
  position: { x: number; z: number };
  size: { w: number; d: number };
  rotation: number; // Faces the street
  occupied: boolean;
  buildingId?: string;
}

export interface TrafficNode {
  id: string;
  position: { x: number; z: number };
  connections: string[]; // IDs of connected nodes
  type: "intersection" | "curve" | "straight";
}

// Nürnberg city layout - based loosely on real geography
export const NUERNBERG_STREETS: StreetSegment[] = [
  // === HAUPTSTRASSEN (Main Roads) ===
  // Südstadt main drag - runs east-west
  {
    id: "hauptstr_1",
    start: { x: -150, z: 40 },
    end: { x: 150, z: 40 },
    width: 16,
    type: "main",
    name: "Allersberger Straße",
  },
  // North-south connector
  {
    id: "hauptstr_2",
    start: { x: 0, z: -150 },
    end: { x: 0, z: 150 },
    width: 16,
    type: "main",
    name: "Pillenreuther Straße",
  },
  // Innenstadt ring
  {
    id: "hauptstr_3",
    start: { x: -100, z: -100 },
    end: { x: 100, z: -100 },
    width: 14,
    type: "main",
    name: "Frauentorgraben",
  },
  {
    id: "hauptstr_4",
    start: { x: -100, z: -150 },
    end: { x: 100, z: -150 },
    width: 14,
    type: "main",
    name: "Königstraße",
  },

  // === NEBENSTRASSEN (Side Streets) - Südstadt ===
  {
    id: "side_s1",
    start: { x: -80, z: 20 },
    end: { x: -80, z: 80 },
    width: 10,
    type: "side",
    name: "Wölckernstraße",
  },
  {
    id: "side_s2",
    start: { x: -40, z: 20 },
    end: { x: -40, z: 80 },
    width: 10,
    type: "side",
    name: "Hummelsteiner Weg",
  },
  {
    id: "side_s3",
    start: { x: 40, z: 20 },
    end: { x: 40, z: 80 },
    width: 10,
    type: "side",
    name: "Schweiggerstraße",
  },
  {
    id: "side_s4",
    start: { x: 80, z: 20 },
    end: { x: 80, z: 80 },
    width: 10,
    type: "side",
    name: "Siebenkeesstraße",
  },
  // Cross streets
  {
    id: "side_s5",
    start: { x: -100, z: 60 },
    end: { x: 100, z: 60 },
    width: 8,
    type: "side",
    name: "Humboldtstraße",
  },
  // === HOME BLOCK ===
  // Continue the traffic graph to the player's Südstadt courtyard. These
  // share exact endpoints because generateTrafficNetwork links by node ID.
  {
    id: "home_north_1",
    start: { x: 0, z: 150 },
    end: { x: 0, z: 190 },
    width: 16,
    type: "main",
    name: "Pillenreuther Straße Süd",
  },
  {
    id: "home_cross_1",
    start: { x: 0, z: 190 },
    end: { x: 100, z: 190 },
    width: 10,
    type: "side",
    name: "Heimstraße",
  },
  {
    id: "home_cross_2",
    start: { x: 0, z: 190 },
    end: { x: -100, z: 190 },
    width: 10,
    type: "side",
    name: "Heimstraße West",
  },
  {
    id: "home_east_1",
    start: { x: 100, z: 190 },
    end: { x: 100, z: 300 },
    width: 9,
    type: "side",
    name: "Hintere Südstadt",
  },

  // === NEBENSTRASSEN - Innenstadt ===
  {
    id: "side_i1",
    start: { x: -60, z: -100 },
    end: { x: -60, z: -180 },
    width: 10,
    type: "side",
    name: "Karolinenstraße",
  },
  {
    id: "side_i2",
    start: { x: 60, z: -100 },
    end: { x: 60, z: -180 },
    width: 10,
    type: "side",
    name: "Breite Gasse",
  },
  {
    id: "side_i3",
    start: { x: -80, z: -130 },
    end: { x: 80, z: -130 },
    width: 8,
    type: "side",
    name: "Ludwigstraße",
  },

  // === NEBENSTRASSEN - Gostenhof ===
  {
    id: "side_g1",
    start: { x: -150, z: 80 },
    end: { x: -100, z: 80 },
    width: 10,
    type: "side",
    name: "Gostenhofer Hauptstraße",
  },
  {
    id: "side_g2",
    start: { x: -130, z: 60 },
    end: { x: -130, z: 120 },
    width: 8,
    type: "side",
    name: "Adam-Klein-Straße",
  },

  // === GASSEN (Alleys) ===
  {
    id: "alley_1",
    start: { x: -20, z: 40 },
    end: { x: -20, z: 60 },
    width: 5,
    type: "alley",
    name: "Hinterhof",
  },
  {
    id: "alley_2",
    start: { x: 20, z: 40 },
    end: { x: 20, z: 60 },
    width: 5,
    type: "alley",
    name: "Seitengasse",
  },

  // === ERLENSTEGEN (hills, unlocks with relationship) ===
  // Anchored on hauptstr_1's east endpoint (150,40) so the traffic graph
  // (which connects nodes by exact shared coordinates) actually reaches it.
  {
    id: "ext_erlenstegen_1",
    start: { x: 150, z: 40 },
    end: { x: 240, z: 10 },
    width: 14,
    type: "main",
    name: "Erlenstegener Allee",
  },
  {
    id: "ext_erlenstegen_2",
    start: { x: 240, z: 10 },
    end: { x: 240, z: 90 },
    width: 10,
    type: "side",
    name: "Rathsbergstraße",
  },
  {
    id: "ext_erlenstegen_3",
    start: { x: 240, z: 10 },
    end: { x: 240, z: -70 },
    width: 10,
    type: "side",
    name: "Zerzabelshofstraße",
  },

  // === INDUSTRIEGEBIET HAFEN (industrial, unlocks with missions) ===
  // Anchored on hauptstr_3's west endpoint (-100,-100).
  {
    id: "ext_hafen_1",
    start: { x: -100, z: -100 },
    end: { x: -230, z: -100 },
    width: 14,
    type: "main",
    name: "Hafenstraße",
  },
  {
    id: "ext_hafen_2",
    start: { x: -230, z: -100 },
    end: { x: -230, z: -40 },
    width: 10,
    type: "side",
    name: "Kanalstraße",
  },
  {
    id: "ext_hafen_3",
    start: { x: -230, z: -100 },
    end: { x: -260, z: -150 },
    width: 10,
    type: "side",
    name: "Werftstraße",
  },

  // === WÖHRDER SEE (beach, unlocks with Maria relationship) ===
  // Anchored on hauptstr_4's east endpoint (100,-150).
  {
    id: "ext_woehrdersee_1",
    start: { x: 100, z: -150 },
    end: { x: 210, z: -210 },
    width: 14,
    type: "main",
    name: "Wöhrder Wiese",
  },
  {
    id: "ext_woehrdersee_2",
    start: { x: 210, z: -210 },
    end: { x: 320, z: -210 },
    width: 10,
    type: "side",
    name: "Seeuferweg",
  },
  {
    id: "ext_woehrdersee_3",
    start: { x: 210, z: -210 },
    end: { x: 210, z: -300 },
    width: 10,
    type: "side",
    name: "Strandallee",
  },
];

function distancePointToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
) {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const abLenSq = abx * abx + abz * abz;
  if (abLenSq === 0) {
    return Math.hypot(apx, apz);
  }

  const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq));
  const cx = ax + abx * t;
  const cz = az + abz * t;
  return Math.hypot(px - cx, pz - cz);
}

function isPointTooCloseToRoad(
  x: number,
  z: number,
  width: number,
  depth: number,
  buffer = 2,
) {
  const tooCloseToStreets = NUERNBERG_STREETS.some((street) => {
    const dx = street.end.x - street.start.x;
    const dz = street.end.z - street.start.z;
    const roadHalfWidth = street.width / 2;
    const objectHalfSpan = Math.abs(dx) >= Math.abs(dz) ? depth / 2 : width / 2;
    const neededDistance = roadHalfWidth + objectHalfSpan + buffer;
    return (
      distancePointToSegment(
        x,
        z,
        street.start.x,
        street.start.z,
        street.end.x,
        street.end.z,
      ) < neededDistance
    );
  });
  if (tooCloseToStreets) return true;

  // second, independent road network (the drivable pavement) — same rule
  return ROADS.some((road) =>
    road.points.slice(0, -1).some((p, i) => {
      const q = road.points[i + 1];
      const neededDistance =
        road.width / 2 + Math.max(width, depth) / 2 + buffer;
      return distancePointToSegment(x, z, p.x, p.z, q.x, q.z) < neededDistance;
    }),
  );
}

// Generate city blocks from streets
export function generateCityBlocks(streets: StreetSegment[]): CityBlock[] {
  const blocks: CityBlock[] = [];

  // Südstadt blocks
  const suedstadtBlocks = [
    {
      id: "block_s1",
      zone: "Südstadt",
      bounds: { minX: -75, maxX: -45, minZ: 42, maxZ: 58 },
    },
    {
      id: "block_s2",
      zone: "Südstadt",
      bounds: { minX: -35, maxX: -5, minZ: 42, maxZ: 58 },
    },
    {
      id: "block_s3",
      zone: "Südstadt",
      bounds: { minX: 5, maxX: 35, minZ: 42, maxZ: 58 },
    },
    {
      id: "block_s4",
      zone: "Südstadt",
      bounds: { minX: 45, maxX: 75, minZ: 42, maxZ: 58 },
    },
    {
      id: "block_s5",
      zone: "Südstadt",
      bounds: { minX: -75, maxX: -45, minZ: 62, maxZ: 78 },
    },
    {
      id: "block_s6",
      zone: "Südstadt",
      bounds: { minX: -35, maxX: -5, minZ: 62, maxZ: 78 },
    },
    {
      id: "block_s7",
      zone: "Südstadt",
      bounds: { minX: 5, maxX: 35, minZ: 62, maxZ: 78 },
    },
    {
      id: "block_s8",
      zone: "Südstadt",
      bounds: { minX: 45, maxX: 75, minZ: 62, maxZ: 78 },
    },
  ];

  // Innenstadt blocks
  const innenstadtBlocks = [
    {
      id: "block_i1",
      zone: "Innenstadt",
      bounds: { minX: -55, maxX: -10, minZ: -98, maxZ: -132 },
    },
    {
      id: "block_i2",
      zone: "Innenstadt",
      bounds: { minX: 10, maxX: 55, minZ: -98, maxZ: -132 },
    },
    {
      id: "block_i3",
      zone: "Innenstadt",
      bounds: { minX: -55, maxX: -10, minZ: -132, maxZ: -148 },
    },
    {
      id: "block_i4",
      zone: "Innenstadt",
      bounds: { minX: 10, maxX: 55, minZ: -132, maxZ: -148 },
    },
  ];

  // Gostenhof blocks
  const gostenhofBlocks = [
    {
      id: "block_g1",
      zone: "Gostenhof",
      bounds: { minX: -148, maxX: -132, minZ: 62, maxZ: 78 },
    },
    {
      id: "block_g2",
      zone: "Gostenhof",
      bounds: { minX: -148, maxX: -132, minZ: 82, maxZ: 118 },
    },
  ];

  [...suedstadtBlocks, ...innenstadtBlocks, ...gostenhofBlocks].forEach(
    (block) => {
      const plots = generatePlotsForBlock(block);
      blocks.push({ ...block, plots });
    },
  );

  return blocks;
}

// Generate building plots within a block
function generatePlotsForBlock(block: {
  id: string;
  zone: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}): BuildingPlot[] {
  const plots: BuildingPlot[] = [];
  const { minX, maxX, minZ, maxZ } = block.bounds;

  const blockWidth = maxX - minX;
  const blockDepth = Math.abs(maxZ - minZ);

  // Standard plot size
  const plotWidth = 12;
  const plotDepth = 10;
  const gap = 2;

  // How many plots fit
  const plotsPerRow = Math.floor(blockWidth / (plotWidth + gap));
  const rows = Math.floor(blockDepth / (plotDepth + gap));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < plotsPerRow; col++) {
      const x = minX + gap + col * (plotWidth + gap) + plotWidth / 2;
      const z =
        (minZ < maxZ ? minZ : maxZ) +
        gap +
        row * (plotDepth + gap) +
        plotDepth / 2;

      if (isPointTooCloseToRoad(x, z, plotWidth, plotDepth)) {
        continue;
      }

      // Determine rotation based on position (face nearest street)
      let rotation = 0;
      if (row === 0)
        rotation = Math.PI; // Face south
      else if (row === rows - 1)
        rotation = 0; // Face north
      else if (col === 0)
        rotation = Math.PI / 2; // Face west
      else if (col === plotsPerRow - 1) rotation = -Math.PI / 2; // Face east

      plots.push({
        id: `${block.id}_plot_${row}_${col}`,
        blockId: block.id,
        position: { x, z },
        size: { w: plotWidth, d: plotDepth },
        rotation,
        occupied: false,
      });
    }
  }

  return plots;
}

// Generate traffic network nodes from streets
export function generateTrafficNetwork(
  streets: StreetSegment[],
): TrafficNode[] {
  const nodes: TrafficNode[] = [];
  const nodeMap = new Map<string, TrafficNode>();

  const posKey = (x: number, z: number) => `${Math.round(x)},${Math.round(z)}`;

  streets.forEach((street) => {
    const startKey = posKey(street.start.x, street.start.z);
    const endKey = posKey(street.end.x, street.end.z);

    // Create or get start node
    if (!nodeMap.has(startKey)) {
      nodeMap.set(startKey, {
        id: `node_${startKey}`,
        position: { ...street.start },
        connections: [],
        type: "intersection",
      });
    }

    // Create or get end node
    if (!nodeMap.has(endKey)) {
      nodeMap.set(endKey, {
        id: `node_${endKey}`,
        position: { ...street.end },
        connections: [],
        type: "intersection",
      });
    }

    // Connect them
    const startNode = nodeMap.get(startKey)!;
    const endNode = nodeMap.get(endKey)!;

    if (!startNode.connections.includes(endNode.id)) {
      startNode.connections.push(endNode.id);
    }
    if (!endNode.connections.includes(startNode.id)) {
      endNode.connections.push(startNode.id);
    }
  });

  return Array.from(nodeMap.values());
}

// Traffic AI pathfinding
export function findPath(
  nodes: TrafficNode[],
  startId: string,
  endId: string,
): TrafficNode[] {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const queue: { node: TrafficNode; path: TrafficNode[] }[] = [];

  const startNode = nodeById.get(startId);
  if (!startNode) return [];

  queue.push({ node: startNode, path: [startNode] });

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node.id === endId) {
      return path;
    }

    if (visited.has(node.id)) continue;
    visited.add(node.id);

    for (const connId of node.connections) {
      if (!visited.has(connId)) {
        const connNode = nodeById.get(connId);
        if (connNode) {
          queue.push({ node: connNode, path: [...path, connNode] });
        }
      }
    }
  }

  return [];
}

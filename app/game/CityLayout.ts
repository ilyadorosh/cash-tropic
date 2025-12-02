// CityLayout.ts - Ordered city grid system for Nürnberg

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
];

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

      // Determine rotation based on position (face nearest street)
      let rotation = 0;
      if (row === 0) rotation = Math.PI; // Face south
      else if (row === rows - 1) rotation = 0; // Face north
      else if (col === 0) rotation = Math.PI / 2; // Face west
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

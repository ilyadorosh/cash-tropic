// NuernbergMap.ts - The definitive map of our Nürnberg
// GRAND THERMODYNAMISCHE AUTOBAHN - Teaching physics through driving!

export interface MapLocation {
  id: string;
  name: string;
  position: { x: number; z: number };
  type: "spawn" | "mission" | "building" | "landmark" | "intersection";
  zone: string;
  description?: string;
}

export interface Road {
  id: string;
  name: string;
  type: "autobahn" | "hauptstrasse" | "nebenstrasse" | "alley";
  points: Array<{ x: number; z: number }>;
  speedLimit: number; // For physics lessons!
  lanes: number;
  width: number;
}

export interface Zone {
  id: string;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  theme: string;
  unlocked: boolean;
  description: string;
}

// =====================================================
// THE MAP - Exact coordinates for everything
// =====================================================

// PLAYER SPAWN - Clear area, guaranteed no buildings
export const PLAYER_SPAWN = {
  position: { x: 0, z: 200 },
  rotation: 0, // Facing north (negative Z)
  zone: "Südstadt",
};

// ZONES - The districts of Nürnberg
export const ZONES: Zone[] = [
  {
    id: "suedstadt",
    name: "Südstadt",
    bounds: { minX: -150, maxX: 150, minZ: 100, maxZ: 300 },
    theme: "slums",
    unlocked: true,
    description: "Wo alles beginnt.  Döner, Spätkaufs, und Träume.",
  },
  {
    id: "innenstadt",
    name: "Innenstadt",
    bounds: { minX: -200, maxX: 200, minZ: -200, maxZ: 100 },
    theme: "downtown",
    unlocked: true,
    description: "Das Herz von Nürnberg. Geschäfte und Geschichte.",
  },
  {
    id: "gostenhof",
    name: "Gostenhof",
    bounds: { minX: -350, maxX: -150, minZ: 50, maxZ: 250 },
    theme: "residential",
    unlocked: true,
    description: "Multikulti mit Charme.",
  },
  {
    id: "hafen",
    name: "Industriegebiet Hafen",
    bounds: { minX: -400, maxX: -200, minZ: -300, maxZ: -100 },
    theme: "industrial",
    unlocked: false,
    description: "Hier wird geschuftet.  Und gedealt.",
  },
  {
    id: "erlenstegen",
    name: "Erlenstegen",
    bounds: { minX: 200, maxX: 450, minZ: -100, maxZ: 150 },
    theme: "hills",
    unlocked: false,
    description: "Wo das Geld wohnt.",
  },
  {
    id: "woehrder_see",
    name: "Wöhrder See",
    bounds: { minX: 200, maxX: 500, minZ: -400, maxZ: -150 },
    theme: "beach",
    unlocked: false,
    description: "Entspannung pur.  Dates mit Marlene.",
  },
  {
    id: "autobahn_nord",
    name: "Autobahn A73 Nord",
    bounds: { minX: -100, maxX: 100, minZ: -600, maxZ: -400 },
    theme: "highway",
    unlocked: true,
    description: "THERMODYNAMISCHE AUTOBAHN - Entropie bei 200 km/h! ",
  },
];

// ROADS - The street network
export const ROADS: Road[] = [
  // === AUTOBAHNEN - For high-speed physics lessons!  ===
  {
    id: "a73",
    name: "A73 - Frankenschnellweg",
    type: "autobahn",
    speedLimit: 200,
    lanes: 3,
    width: 30,
    points: [
      { x: 0, z: 400 }, // South entry
      { x: 0, z: 200 }, // Past spawn
      { x: 0, z: 0 }, // Center
      { x: 0, z: -200 }, // North
      { x: 0, z: -400 }, // Far north
      { x: 0, z: -600 }, // Exit
    ],
  },
  {
    id: "a6",
    name: "A6 - Ost-West Autobahn",
    type: "autobahn",
    speedLimit: 180,
    lanes: 2,
    width: 24,
    points: [
      { x: -500, z: -100 }, // West entry (Hafen)
      { x: -300, z: -100 },
      { x: -100, z: -100 },
      { x: 0, z: -100 }, // Kreuz with A73
      { x: 100, z: -100 },
      { x: 300, z: -100 }, // East (Erlenstegen)
      { x: 500, z: -100 }, // Exit
    ],
  },

  // === HAUPTSTRASSEN ===
  {
    id: "allersberger",
    name: "Allersberger Straße",
    type: "hauptstrasse",
    speedLimit: 50,
    lanes: 2,
    width: 14,
    points: [
      { x: -150, z: 180 },
      { x: 0, z: 180 },
      { x: 150, z: 180 },
    ],
  },
  {
    id: "pillenreuther",
    name: "Pillenreuther Straße",
    type: "hauptstrasse",
    speedLimit: 50,
    lanes: 2,
    width: 14,
    points: [
      { x: -50, z: 300 },
      { x: -50, z: 200 },
      { x: -50, z: 100 },
      { x: -50, z: 0 },
    ],
  },
  {
    id: "koenigstrasse",
    name: "Königstraße",
    type: "hauptstrasse",
    speedLimit: 30,
    lanes: 2,
    width: 12,
    points: [
      { x: -180, z: -50 },
      { x: 0, z: -50 },
      { x: 180, z: -50 },
    ],
  },

  // === NEBENSTRASSEN Südstadt ===
  {
    id: "woelckern",
    name: "Wölckernstraße",
    type: "nebenstrasse",
    speedLimit: 30,
    lanes: 1,
    width: 8,
    points: [
      { x: -80, z: 160 },
      { x: -80, z: 220 },
      { x: -80, z: 280 },
    ],
  },
  {
    id: "hummelstein",
    name: "Hummelsteiner Weg",
    type: "nebenstrasse",
    speedLimit: 30,
    lanes: 1,
    width: 8,
    points: [
      { x: 80, z: 160 },
      { x: 80, z: 220 },
      { x: 80, z: 280 },
    ],
  },
];

// KEY LOCATIONS - Exact positions for missions, NPCs, landmarks
export const LOCATIONS: MapLocation[] = [
  // === SPAWN AREA - KEEP CLEAR! ===
  {
    id: "spawn",
    name: "Startpunkt",
    position: { x: 0, z: 200 },
    type: "spawn",
    zone: "Südstadt",
    description: "Hier beginnt deine Reise.",
  },

  // === KIRCHE - Sanctuary ===
  {
    id: "kirche",
    name: "St. Elisabeth Kirche",
    position: { x: -120, z: 150 },
    type: "landmark",
    zone: "Südstadt",
    description: "Zuflucht.  Hier vergibt Gott deine Sterne.",
  },

  // === EDUCATIONAL NPCs ===
  {
    id: "professor_weber",
    name: "Professor Webers Büro",
    position: { x: 50, z: -80 },
    type: "mission",
    zone: "Innenstadt",
    description: "Physik-Lektionen. Entropie, Energie, Vektoren.",
  },
  {
    id: "sponsor_klaus",
    name: "AA Treffpunkt",
    position: { x: -100, z: 160 },
    type: "mission",
    zone: "Südstadt",
    description: "12 Schritte. Der Weg zur Genesung.",
  },
  {
    id: "doctor_mueller",
    name: "Praxis Dr. Müller",
    position: { x: 30, z: -130 },
    type: "mission",
    zone: "Innenstadt",
    description: "Gesundheitslektionen. Zucker, Koffein, Sucht.",
  },
  {
    id: "banker_schmidt",
    name: "Sparkasse Nürnberg",
    position: { x: -30, z: -120 },
    type: "mission",
    zone: "Innenstadt",
    description: "Finanzlektionen. Zinseszins, Risiko, Bitcoin.",
  },
  {
    id: "crypto_kid",
    name: "Crypto Café",
    position: { x: 80, z: -60 },
    type: "mission",
    zone: "Innenstadt",
    description: "Bitcoin & Blockchain. Thermodynamik des Geldes.",
  },

  // === STORY NPCs ===
  {
    id: "marlene",
    name: "Marlenes Wohnung",
    position: { x: 60, z: 220 },
    type: "mission",
    zone: "Südstadt",
    description: "Deine Freundin. Kompliziert.",
  },
  {
    id: "mc_lukas",
    name: "MC Lukas Studio",
    position: { x: -40, z: 250 },
    type: "mission",
    zone: "Südstadt",
    description: "Möchtegern-Rapper. Loyal aber nervig.",
  },
  {
    id: "pfarrer_mueller",
    name: "Pfarrhaus",
    position: { x: -130, z: 140 },
    type: "mission",
    zone: "Südstadt",
    description: "Beichte. Vergebung.  Die Dieb-Mission.",
  },

  // === AUTOBAHN PHYSICS LAB ===
  {
    id: "autobahn_entry",
    name: "Autobahnauffahrt A73",
    position: { x: 0, z: -200 },
    type: "landmark",
    zone: "Innenstadt",
    description:
      "THERMODYNAMISCHE AUTOBAHN - Hier lernst du Physik bei Tempo 200!",
  },
  {
    id: "autobahn_lab",
    name: "Boltzmann Raststätte",
    position: { x: 0, z: -500 },
    type: "mission",
    zone: "Autobahn",
    description: "Ludwig Boltzmann erklärt Entropie.  Mit Autos.",
  },

  // === BUILDINGS - With exact plot positions ===
  // Südstadt buildings - AWAY from spawn!
  {
    id: "doener_1",
    name: "Öncü Döner",
    position: { x: -70, z: 175 },
    type: "building",
    zone: "Südstadt",
  },
  {
    id: "spaetkauf_1",
    name: "Metin's Spätkauf",
    position: { x: -95, z: 190 },
    type: "building",
    zone: "Südstadt",
  },
  {
    id: "wettbuero",
    name: "Glückspilz Wettbüro",
    position: { x: 70, z: 175 },
    type: "building",
    zone: "Südstadt",
  },
  {
    id: "shisha",
    name: "Shisha Palace",
    position: { x: 95, z: 190 },
    type: "building",
    zone: "Südstadt",
  },
  // ...  more buildings, all with exact positions
];

// BUILDING PLOTS - Where buildings CAN spawn
export const BUILDING_PLOTS: Array<{
  id: string;
  position: { x: number; z: number };
  size: { w: number; d: number };
  zone: string;
  rotation: number;
}> = [
  // Südstadt plots - NOT near spawn (z: 200)
  {
    id: "plot_s1",
    position: { x: -70, z: 175 },
    size: { w: 15, d: 12 },
    zone: "Südstadt",
    rotation: 0,
  },
  {
    id: "plot_s2",
    position: { x: -95, z: 190 },
    size: { w: 12, d: 10 },
    zone: "Südstadt",
    rotation: Math.PI / 2,
  },
  {
    id: "plot_s3",
    position: { x: -70, z: 250 },
    size: { w: 15, d: 12 },
    zone: "Südstadt",
    rotation: 0,
  },
  {
    id: "plot_s4",
    position: { x: -95, z: 265 },
    size: { w: 12, d: 10 },
    zone: "Südstadt",
    rotation: Math.PI / 2,
  },
  {
    id: "plot_s5",
    position: { x: 70, z: 175 },
    size: { w: 15, d: 12 },
    zone: "Südstadt",
    rotation: 0,
  },
  {
    id: "plot_s6",
    position: { x: 95, z: 190 },
    size: { w: 12, d: 10 },
    zone: "Südstadt",
    rotation: -Math.PI / 2,
  },
  {
    id: "plot_s7",
    position: { x: 70, z: 250 },
    size: { w: 15, d: 12 },
    zone: "Südstadt",
    rotation: 0,
  },
  {
    id: "plot_s8",
    position: { x: 95, z: 265 },
    size: { w: 12, d: 10 },
    zone: "Südstadt",
    rotation: -Math.PI / 2,
  },

  // Innenstadt plots
  {
    id: "plot_i1",
    position: { x: -60, z: -60 },
    size: { w: 20, d: 15 },
    zone: "Innenstadt",
    rotation: 0,
  },
  {
    id: "plot_i2",
    position: { x: -30, z: -60 },
    size: { w: 18, d: 15 },
    zone: "Innenstadt",
    rotation: 0,
  },
  {
    id: "plot_i3",
    position: { x: 30, z: -60 },
    size: { w: 18, d: 15 },
    zone: "Innenstadt",
    rotation: 0,
  },
  {
    id: "plot_i4",
    position: { x: 60, z: -60 },
    size: { w: 20, d: 15 },
    zone: "Innenstadt",
    rotation: 0,
  },
  // ... more plots
];

// NO-BUILD ZONES - Keep these areas clear!
export const NO_BUILD_ZONES = [
  { center: PLAYER_SPAWN.position, radius: 60 }, // Spawn area
  { center: { x: -120, z: 150 }, radius: 40 }, // Church area
  { center: { x: 0, z: 0 }, radius: 30 }, // City center intersection
];

// Helper: Check if position is in a no-build zone
export function isInNoBuildZone(x: number, z: number): boolean {
  return NO_BUILD_ZONES.some((zone) => {
    const dx = x - zone.center.x;
    const dz = z - zone.center.z;
    return Math.sqrt(dx * dx + dz * dz) < zone.radius;
  });
}

// Helper: Get zone at position
export function getZoneAt(x: number, z: number): Zone | null {
  return (
    ZONES.find(
      (zone) =>
        x >= zone.bounds.minX &&
        x <= zone.bounds.maxX &&
        z >= zone.bounds.minZ &&
        z <= zone.bounds.maxZ,
    ) || null
  );
}

// Helper: Get nearest road
export function getNearestRoad(x: number, z: number): Road | null {
  let nearest: Road | null = null;
  let minDist = Infinity;

  ROADS.forEach((road) => {
    road.points.forEach((point) => {
      const dist = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2),
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = road;
      }
    });
  });

  return nearest;
}

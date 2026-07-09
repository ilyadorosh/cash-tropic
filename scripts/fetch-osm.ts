// fetch-osm.ts — pull a real city district from OpenStreetMap (Overpass API)
// and convert it to the game's map format: street polylines + oriented
// building rectangles + named landmarks, in local meters around a center.
//
// usage: bun scripts/fetch-osm.ts <id> <displayName> <lat> <lon> <sizeMeters>
// output: public/maps/<id>.json
//
// Data © OpenStreetMap contributors, ODbL — attribution ships in the JSON
// and must stay visible wherever the maps are shown.

import { writeFileSync } from "node:fs";

type Pt = [number, number]; // [x, z] game meters; north = -z (map convention)

interface OsmElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

interface DistrictStreet {
  n: string;
  t: "main" | "side" | "alley";
  w: number;
  speed: number;
  pts: Pt[];
}

interface DistrictBuilding {
  n?: string;
  x: number;
  z: number;
  w: number;
  d: number;
  rot: number;
  h: number;
  lm?: boolean; // landmark (research institute, university, museum…)
}

const [id, displayName, latS, lonS, sizeS] = process.argv.slice(2);
if (!id || !latS || !lonS) {
  console.error(
    "usage: bun scripts/fetch-osm.ts <id> <name> <lat> <lon> <sizeMeters>",
  );
  process.exit(1);
}
const lat0 = parseFloat(latS);
const lon0 = parseFloat(lonS);
const size = parseFloat(sizeS || "800");

// equirectangular projection around the district center; north = -z
const mPerLat = 111_320;
const mPerLon = Math.cos((lat0 * Math.PI) / 180) * 111_320;
const proj = (lat: number, lon: number): Pt => [
  Math.round((lon - lon0) * mPerLon * 10) / 10,
  Math.round(-(lat - lat0) * mPerLat * 10) / 10,
];

const dLat = size / 2 / mPerLat;
const dLon = size / 2 / mPerLon;
const bbox = `${lat0 - dLat},${lon0 - dLon},${lat0 + dLat},${lon0 + dLon}`;

const HIGHWAY_CLASS: Record<
  string,
  { t: DistrictStreet["t"]; w: number; speed: number }
> = {
  motorway: { t: "main", w: 24, speed: 130 },
  trunk: { t: "main", w: 20, speed: 100 },
  primary: { t: "main", w: 16, speed: 50 },
  secondary: { t: "main", w: 14, speed: 50 },
  tertiary: { t: "side", w: 11, speed: 40 },
  residential: { t: "side", w: 9, speed: 30 },
  unclassified: { t: "side", w: 9, speed: 30 },
  living_street: { t: "alley", w: 6, speed: 7 },
  pedestrian: { t: "alley", w: 7, speed: 7 },
};

const LANDMARK_KEYS = [
  ["amenity", "research_institute"],
  ["amenity", "university"],
  ["amenity", "place_of_worship"],
  ["amenity", "townhall"],
  ["tourism", "museum"],
  ["tourism", "attraction"],
  ["historic", ""],
];

// Douglas-Peucker polyline simplification (epsilon in meters)
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length <= 2) return pts;
  const d2 = (p: Pt, a: Pt, b: Pt) => {
    const [px, pz] = p;
    const [ax, az] = a;
    const [bx, bz] = b;
    const dx = bx - ax;
    const dz = bz - az;
    const len2 = dx * dx + dz * dz || 1e-9;
    const u = Math.max(
      0,
      Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2),
    );
    const qx = ax + u * dx;
    const qz = az + u * dz;
    return (px - qx) ** 2 + (pz - qz) ** 2;
  };
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const dd = d2(pts[i], pts[0], pts[pts.length - 1]);
    if (dd > maxD) {
      maxD = dd;
      idx = i;
    }
  }
  if (maxD > eps * eps) {
    const left = simplify(pts.slice(0, idx + 1), eps);
    const right = simplify(pts.slice(idx), eps);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

// fit an oriented rectangle to a building footprint: longest edge sets the
// angle (the game draws buildings as rotated boxes, so this is exact enough)
function fitRect(pts: Pt[]) {
  let bestLen = -1;
  let theta = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dz = pts[i + 1][1] - pts[i][1];
    const len = dx * dx + dz * dz;
    if (len > bestLen) {
      bestLen = len;
      theta = Math.atan2(dz, dx);
    }
  }
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (const [x, z] of pts) {
    const xr = x * c + z * s;
    const zr = -x * s + z * c;
    if (xr < minX) minX = xr;
    if (xr > maxX) maxX = xr;
    if (zr < minZ) minZ = zr;
    if (zr > maxZ) maxZ = zr;
  }
  const cxr = (minX + maxX) / 2;
  const czr = (minZ + maxZ) / 2;
  return {
    x: Math.round((cxr * c - czr * s) * 10) / 10,
    z: Math.round((cxr * s + czr * c) * 10) / 10,
    w: Math.round((maxX - minX) * 10) / 10,
    d: Math.round((maxZ - minZ) * 10) / 10,
    // three.js rotation.y turns local +x toward -z; our theta is in x/z
    rot: Math.round(-theta * 1000) / 1000,
  };
}

function buildingHeight(tags: Record<string, string>, osmId: number): number {
  const h = parseFloat(tags["height"] ?? "");
  if (!isNaN(h) && h > 2) return Math.round(Math.min(h, 120));
  const lv = parseFloat(tags["building:levels"] ?? "");
  if (!isNaN(lv) && lv > 0) return Math.round(lv * 3.3 + 2);
  return 8 + (osmId % 7); // deterministic filler, 8–14m
}

function isLandmark(tags: Record<string, string>): boolean {
  return LANDMARK_KEYS.some(([k, v]) =>
    v ? tags[k] === v : tags[k] !== undefined,
  );
}

async function main() {
  const query = `[out:json][timeout:90];
(
  way["highway"~"^(${Object.keys(HIGHWAY_CLASS).join("|")})$"](${bbox});
  way["building"](${bbox});
  way["amenity"~"^(research_institute|university|townhall|place_of_worship)$"](${bbox});
  way["tourism"~"^(museum|attraction)$"](${bbox});
  node["amenity"~"^(research_institute|university|townhall)$"](${bbox});
  node["tourism"~"^(museum|attraction)$"](${bbox});
  node["historic"](${bbox});
);
out geom;`;

  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
  ];
  console.error(`[${id}] querying Overpass, bbox=${bbox}`);
  let data: { elements: OsmElement[] } | null = null;
  let lastErr = "";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass rejects anonymous default agents with 406
          "User-Agent": "cash-tropic-map-builder/1.0 (actinlove.com)",
        },
        // dense city centers (Berlin Mitte…) can take minutes; the runtime
        // default fetch timeout is shorter than that
        signal: AbortSignal.timeout(240_000),
      });
      const text = await res.text();
      if (res.ok && !text.includes("runtime error")) {
        data = JSON.parse(text);
        break;
      }
      lastErr = `${url} → ${res.status}: ${text.slice(0, 200)}`;
    } catch (e) {
      lastErr = `${url} → ${e}`;
    }
    console.error(`[${id}] endpoint busy/slow, trying next…`);
  }
  if (!data) throw new Error(`all Overpass endpoints failed: ${lastErr}`);

  const streets: DistrictStreet[] = [];
  const buildings: DistrictBuilding[] = [];
  const pois: Array<{ n: string; x: number; z: number }> = [];
  const poiNames = new Set<string>();
  const addPoi = (n: string, x: number, z: number) => {
    if (poiNames.has(n)) return;
    poiNames.add(n);
    pois.push({ n, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 });
  };

  for (const el of data.elements) {
    if (!el.tags) continue;

    // named point landmarks (research institutes, museums, memorials…)
    if (el.type === "node" && el.tags["name"]) {
      const anyEl = el as unknown as { lat: number; lon: number };
      const [x, z] = proj(anyEl.lat, anyEl.lon);
      addPoi(el.tags["name"], x, z);
      continue;
    }

    if (el.type !== "way" || !el.geometry) continue;
    const pts = el.geometry.map((g) => proj(g.lat, g.lon));

    const hw = el.tags["highway"];
    if (hw && HIGHWAY_CLASS[hw]) {
      const cls = HIGHWAY_CLASS[hw];
      const maxspeed = parseFloat(el.tags["maxspeed"] ?? "");
      streets.push({
        n: el.tags["name"] ?? hw,
        t: cls.t,
        w: cls.w,
        speed: !isNaN(maxspeed) ? maxspeed : cls.speed,
        pts: simplify(pts, 3),
      });
    } else if (el.tags["building"]) {
      const rect = fitRect(pts);
      if (rect.w < 3 || rect.d < 3) continue; // sheds etc.
      const b: DistrictBuilding = {
        ...rect,
        h: buildingHeight(el.tags, el.id),
      };
      if (el.tags["name"]) b.n = el.tags["name"];
      if (isLandmark(el.tags)) b.lm = true;
      buildings.push(b);
    } else if (isLandmark(el.tags) && el.tags["name"]) {
      // landmark grounds without a building tag (e.g. the MPI campus
      // perimeter): keep as a named point at the centroid
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      addPoi(el.tags["name"], cx, cz);
    }
  }

  // keep the biggest buildings if the district is dense (perf budget)
  buildings.sort(
    (a, b) => (b.lm ? 1 : 0) - (a.lm ? 1 : 0) || b.w * b.d - a.w * a.d,
  );
  const kept = buildings.slice(0, 600);

  const out = {
    id,
    name: displayName || id,
    attribution: "Map data © OpenStreetMap contributors (ODbL)",
    center: { lat: lat0, lon: lon0 },
    sizeMeters: size,
    streets,
    buildings: kept,
    pois: pois.slice(0, 40),
  };

  const path = `public/maps/${id}.json`;
  writeFileSync(path, JSON.stringify(out));
  console.error(
    `[${id}] wrote ${path}: ${streets.length} streets, ${kept.length}/${buildings.length} buildings, ` +
      `${kept.filter((b) => b.lm).length} lm-buildings, ${pois.length} pois, ${(JSON.stringify(out).length / 1024).toFixed(0)}KB`,
  );
  for (const p of pois.slice(0, 10))
    console.error(`   ★ ${p.n} @ (${p.x}, ${p.z})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

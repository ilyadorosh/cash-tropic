// RealDistricts.ts — real cities inside the game, from OpenStreetMap.
// scripts/fetch-osm.ts converts a real bbox (streets + building footprints)
// into public/maps/<id>.json; this module loads those files and materializes
// them as drivable districts: merged street geometry (one draw call for all
// pavement) and an InstancedMesh for every building (one draw call per
// district), so whole real cities cost a handful of draw calls.
//
// Map data © OpenStreetMap contributors (ODbL).

import * as THREE from "three";

export interface DistrictStreetJson {
  n: string;
  t: "main" | "side" | "alley";
  w: number;
  speed: number;
  pts: Array<[number, number]>;
}

export interface DistrictBuildingJson {
  n?: string;
  x: number;
  z: number;
  w: number;
  d: number;
  rot: number;
  h: number;
  lm?: boolean;
}

export interface DistrictJson {
  id: string;
  name: string;
  attribution: string;
  sizeMeters: number;
  streets: DistrictStreetJson[];
  buildings: DistrictBuildingJson[];
  // named places without a building footprint (institute campuses,
  // memorials, museums) — anchors for portals, exhibits, missions
  pois?: Array<{ n: string; x: number; z: number }>;
}

export interface DistrictDef {
  id: string;
  name: string;
  // world placement (game meters); real relative geography, compressed
  offset: { x: number; z: number };
  accent: number; // district identity color
}

// Nuremberg core (the stylized hometown map) sits at the origin.
// True compass directions from there: Fürth WNW, Erlangen N, Berlin far NNE.
export const DISTRICTS: DistrictDef[] = [
  {
    id: "aufsessplatz",
    name: "Aufseßplatz, Nürnberg",
    // Close enough to the old core to drive there, far enough that the real
    // footprint does not overlap the stylized legacy blocks.
    offset: { x: 700, z: 400 },
    accent: 0x58a66a,
  },
  {
    id: "nuernberg",
    name: "Nürnberg Altstadt",
    offset: { x: 1200, z: -900 },
    accent: 0xcc4444, // Burg sandstone red
  },
  {
    id: "fuerth",
    name: "Fürth",
    offset: { x: -1600, z: -1100 },
    accent: 0x44aa66, // Kleeblatt green
  },
  {
    id: "erlangen",
    name: "Erlangen — MPI Physik des Lichts",
    offset: { x: 300, z: -2600 },
    accent: 0x33bbee, // photon blue
  },
  {
    id: "berlin",
    name: "Berlin Mitte",
    offset: { x: 2400, z: -3400 },
    accent: 0xddaa33, // Ampelmann amber
  },
];

export interface BuiltDistrict {
  def: DistrictDef;
  json: DistrictJson;
  group: THREE.Group;
  // Oriented footprint colliders compatible with the engine's collision loop
  colliders: THREE.Mesh[];
  // world-space named landmarks (for portals, exhibits, missions)
  landmarks: Array<{ name: string; x: number; z: number; h: number }>;
}

const STREET_COLOR: Record<DistrictStreetJson["t"], number> = {
  main: 0x333333,
  side: 0x444444,
  alley: 0x505050,
};

function textSprite(
  text: string,
  color: string,
  scale: number,
  bg?: string,
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = "700 42px system-ui, sans-serif";
  ctx.font = font;
  const w = Math.min(1024, Math.ceil(ctx.measureText(text).width) + 40);
  canvas.width = w;
  canvas.height = 64;
  ctx.font = font;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, 64);
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, 34);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set((scale * w) / 64, scale, 1);
  return sprite;
}

// all street segments of a district as one merged triangle soup
function buildStreets(json: DistrictJson): THREE.Mesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const c = new THREE.Color();

  for (const street of json.streets) {
    c.setHex(STREET_COLOR[street.t] ?? 0x444444);
    const half = street.w / 2;
    for (let i = 0; i < street.pts.length - 1; i++) {
      const [x1, z1] = street.pts[i];
      const [x2, z2] = street.pts[i + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      if (len < 0.5) continue;
      // perpendicular in the ground plane
      const px = (-dz / len) * half;
      const pz = (dx / len) * half;
      const y = 0.05;
      // two triangles: (a1,b1,a2) (a2,b1,b2)
      const quad = [
        [x1 + px, y, z1 + pz],
        [x1 - px, y, z1 - pz],
        [x2 + px, y, z2 + pz],
        [x2 + px, y, z2 + pz],
        [x1 - px, y, z1 - pz],
        [x2 - px, y, z2 - pz],
      ];
      for (const [vx, vy, vz] of quad) {
        positions.push(vx, vy, vz);
        colors.push(c.r, c.g, c.b);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// one shared facade texture — a grid of windows, some lit. Instance colors
// multiply over it, so every building gets windows plus its own tint for
// the cost of a single 64×128 canvas.
let _facadeTex: THREE.Texture | null = null;
function facadeTexture(): THREE.Texture {
  if (_facadeTex) return _facadeTex;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#969696";
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 122; y += 12) {
    for (let x = 6; x < 58; x += 12) {
      const lit = Math.random() < 0.25;
      ctx.fillStyle = lit ? "#ffe9a8" : "#39414a";
      ctx.fillRect(x, y, 7, 8);
    }
  }
  _facadeTex = new THREE.CanvasTexture(c);
  _facadeTex.magFilter = THREE.NearestFilter;
  return _facadeTex;
}

// every building of the district in a single InstancedMesh
function buildBuildings(json: DistrictJson, accent: number) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0); // origin at the base, so scaling sets height
  const mat = new THREE.MeshLambertMaterial({ map: facadeTexture() });
  const mesh = new THREE.InstancedMesh(geo, mat, json.buildings.length);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();
  const accentCol = new THREE.Color(accent);

  json.buildings.forEach((b, i) => {
    q.setFromAxisAngle(up, b.rot);
    m.compose(
      new THREE.Vector3(b.x, 0, b.z),
      q,
      new THREE.Vector3(Math.max(2, b.w - 0.6), b.h, Math.max(2, b.d - 0.6)),
    );
    mesh.setMatrixAt(i, m);
    if (b.lm) {
      col.copy(accentCol);
    } else {
      // muted, deterministic per-footprint variation (bright enough that
      // the multiplied facade texture keeps its window contrast)
      const t = ((b.x * 7 + b.z * 13) % 40) / 40;
      col.setHSL(0.08 + t * 0.06, 0.12 + t * 0.1, 0.55 + t * 0.2);
    }
    mesh.setColorAt(i, col);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false; // thousands of shadow casters would hurt; sun still lights them
  return mesh;
}

export async function loadDistrict(
  def: DistrictDef,
): Promise<BuiltDistrict | null> {
  try {
    const res = await fetch(`/maps/${def.id}.json`);
    if (!res.ok) return null;
    const json = (await res.json()) as DistrictJson;

    const group = new THREE.Group();
    group.position.set(def.offset.x, 0, def.offset.z);

    group.add(buildStreets(json));
    group.add(buildBuildings(json, def.accent));

    // district name floats high at the center — visible from far away,
    // but not billboard-of-doom sized
    const homeDistrict = def.id === "aufsessplatz";
    const title = textSprite(
      json.name,
      "#ffffff",
      homeDistrict ? 4 : 13,
      "rgba(0,0,0,0.7)",
    );
    title.position.set(0, homeDistrict ? 24 : 80, 0);
    group.add(title);

    const landmarks: BuiltDistrict["landmarks"] = [];
    const colliders: THREE.Mesh[] = [];

    if (def.id === "aufsessplatz") {
      const fountain = new THREE.Group();
      const basin = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 5.5, 0.8, 28),
        new THREE.MeshStandardMaterial({ color: 0x8d8980, roughness: 0.9 }),
      );
      basin.position.y = 0.4;
      fountain.add(basin);
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(4.6, 4.6, 0.18, 28),
        new THREE.MeshStandardMaterial({
          color: 0x4c9db8,
          emissive: 0x173947,
          transparent: true,
          opacity: 0.85,
        }),
      );
      water.position.y = 0.88;
      fountain.add(water);
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 1.15, 3.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x756f65, roughness: 0.85 }),
      );
      pedestal.position.y = 2.2;
      fountain.add(pedestal);
      const figure = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.42, 1.5, 5, 8),
        new THREE.MeshStandardMaterial({
          color: 0x365d4d,
          metalness: 0.7,
          roughness: 0.55,
        }),
      );
      figure.position.y = 4.6;
      fountain.add(figure);
      const fountainLabel = textSprite(
        "Nymphenbrunnen · Aufseßplatz",
        "#dff6e3",
        3.5,
      );
      fountainLabel.position.y = 8;
      fountain.add(fountainLabel);
      group.add(fountain);

      const fountainCollider = new THREE.Mesh(
        new THREE.BoxGeometry(10.4, 2, 10.4),
      );
      fountainCollider.position.set(def.offset.x, 1, def.offset.z);
      fountainCollider.visible = false;
      fountainCollider.userData = {
        width: 10.4,
        depth: 10.4,
        buildingId: "aufsessplatz-nymphenbrunnen",
      };
      colliders.push(fountainCollider);
      landmarks.push({
        name: "Nymphenbrunnen · Aufseßplatz",
        x: def.offset.x,
        z: def.offset.z,
        h: 6,
      });
    }

    for (const b of json.buildings) {
      // Match the rendered oriented rectangle. The former AABB enclosed large
      // empty triangles around angled buildings, so cars hit invisible space.
      const cw = Math.max(2, b.w - 0.6);
      const cd = Math.max(2, b.d - 0.6);
      const collider = new THREE.Mesh(new THREE.BoxGeometry(cw, b.h, cd));
      collider.position.set(def.offset.x + b.x, b.h / 2, def.offset.z + b.z);
      collider.rotation.y = b.rot;
      collider.visible = false;
      collider.userData = {
        width: cw,
        depth: cd,
        buildingId: `${def.id}`,
      };
      colliders.push(collider);

      if (b.n && (b.lm || b.w * b.d > 400)) {
        const label = textSprite(
          b.n,
          b.lm ? "#aaeeff" : "#ffffff",
          b.lm ? 8 : 5,
        );
        label.position.set(b.x, b.h + 6, b.z);
        group.add(label);
        landmarks.push({
          name: b.n,
          x: def.offset.x + b.x,
          z: def.offset.z + b.z,
          h: b.h,
        });
      }
    }

    // named places without footprints (institute campuses, memorials…):
    // these are the anchors that matter — the MPI arrives this way
    for (const p of json.pois ?? []) {
      const label = textSprite(p.n, "#ffe08a", 7);
      label.position.set(p.x, 22, p.z);
      group.add(label);
      landmarks.push({
        name: p.n,
        x: def.offset.x + p.x,
        z: def.offset.z + p.z,
        h: 0,
      });
    }

    return { def, json, group, colliders, landmarks };
  } catch (e) {
    console.warn(`[districts] failed to load ${def.id}:`, e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Autobahn connectors: real geography, drivable. A73 really does run
// Nürnberg → Fürth/Erlangen; the A9 runs to Berlin.
// ---------------------------------------------------------------------------
export interface ConnectorRoad {
  name: string;
  width: number;
  pts: Array<[number, number]>;
}

export function connectorRoads(): ConnectorRoad[] {
  const d = Object.fromEntries(DISTRICTS.map((x) => [x.id, x.offset]));
  return [
    {
      name: "Südstadt → Aufseßplatz",
      width: 12,
      pts: [
        [100, 190],
        [300, 240],
        [520, 330],
        [d.aufsessplatz.x, d.aufsessplatz.z],
      ],
    },
    {
      name: "A73 Frankenschnellweg → Erlangen",
      width: 24,
      // continues the core map's A73 (x=0 axis) north to Erlangen
      pts: [
        [0, -600],
        [50, -1200],
        [150, -1900],
        [d.erlangen.x, d.erlangen.z + 420],
      ],
    },
    {
      name: "A73 → Fürth",
      width: 20,
      pts: [
        [0, -600],
        [-500, -800],
        [-1000, -950],
        [d.fuerth.x + 420, d.fuerth.z],
      ],
    },
    {
      name: "B4 → Nürnberg Altstadt",
      width: 16,
      pts: [
        [200, -400],
        [600, -600],
        [d.nuernberg.x - 420, d.nuernberg.z],
      ],
    },
    {
      name: "A9 → Berlin",
      width: 24,
      pts: [
        [d.erlangen.x + 300, d.erlangen.z],
        [1200, -2800],
        [1800, -3100],
        [d.berlin.x - 450, d.berlin.z],
      ],
    },
  ];
}

export function buildConnectors(): THREE.Group {
  const group = new THREE.Group();
  for (const road of connectorRoads()) {
    const positions: number[] = [];
    const half = road.width / 2;
    for (let i = 0; i < road.pts.length - 1; i++) {
      const [x1, z1] = road.pts[i];
      const [x2, z2] = road.pts[i + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const px = (-dz / len) * half;
      const pz = (dx / len) * half;
      const y = 0.04;
      positions.push(
        x1 + px,
        y,
        z1 + pz,
        x1 - px,
        y,
        z1 - pz,
        x2 + px,
        y,
        z2 + pz,
        x2 + px,
        y,
        z2 + pz,
        x1 - px,
        y,
        z1 - pz,
        x2 - px,
        y,
        z2 - pz,
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({ color: 0x2e2e2e }),
    );
    mesh.receiveShadow = true;
    group.add(mesh);

    const label = textSprite(road.name, "#88ccff", 10);
    const mid = road.pts[Math.floor(road.pts.length / 2)];
    label.position.set(mid[0], 24, mid[1]);
    group.add(label);
  }
  return group;
}

// ---------------------------------------------------------------------------
// PHYSICS EXHIBITS
// ---------------------------------------------------------------------------

// Non-locality: a pair of entangled portals. Step into one, exist at the
// other. Einstein called it "spukhafte Fernwirkung" — from Berlin, where
// he said it. One end at the MPI for the Science of Light, one in Mitte.
export interface PortalPair {
  a: THREE.Group;
  b: THREE.Group;
  update: (t: number) => void;
  // returns the exit position if `pos` is inside a portal, else null
  check: (pos: THREE.Vector3) => THREE.Vector3 | null;
}

export function createEntangledPortals(
  posA: { x: number; z: number },
  posB: { x: number; z: number },
): PortalPair {
  const mk = (p: { x: number; z: number }, label: string) => {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, 0.35, 12, 40),
      new THREE.MeshBasicMaterial({ color: 0xb46bff }),
    );
    ring.position.y = 4;
    g.add(ring);
    const glow = new THREE.PointLight(0xa45cff, 1.6, 30);
    glow.position.y = 4;
    g.add(glow);
    const sign = textSprite(label, "#d9b3ff", 6);
    sign.position.y = 9.5;
    g.add(sign);
    g.position.set(p.x, 0, p.z);
    g.userData.ring = ring;
    return g;
  };
  const a = mk(posA, "verschränkt ⇄ Berlin");
  const b = mk(posB, "verschränkt ⇄ Erlangen");

  let cooldownUntil = 0;
  const va = new THREE.Vector3(posA.x, 0, posA.z);
  const vb = new THREE.Vector3(posB.x, 0, posB.z);

  return {
    a,
    b,
    update(t: number) {
      for (const g of [a, b]) {
        const ring = g.userData.ring as THREE.Mesh;
        ring.rotation.y = t * 0.8;
        ring.rotation.x = Math.sin(t * 0.6) * 0.4;
        ring.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
      }
    },
    check(pos: THREE.Vector3): THREE.Vector3 | null {
      const now = performance.now();
      if (now < cooldownUntil) return null;
      const flat = new THREE.Vector3(pos.x, 0, pos.z);
      if (flat.distanceTo(va) < 4.5) {
        cooldownUntil = now + 4000;
        return new THREE.Vector3(vb.x + 8, pos.y, vb.z + 8);
      }
      if (flat.distanceTo(vb) < 4.5) {
        cooldownUntil = now + 4000;
        return new THREE.Vector3(va.x + 8, pos.y, va.z + 8);
      }
      return null;
    },
  };
}

// Wave nature: a live double-slit screen. |ψ|² = |ψ₁+ψ₂|² of two coherent
// sources, phase animated — interference fringes breathing on a billboard
// in front of the institute that studies exactly this.
export interface DoubleSlit {
  group: THREE.Group;
  update: (t: number) => void;
}

export function createDoubleSlit(pos: { x: number; z: number }): DoubleSlit {
  const W = 128;
  const H = 64;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const tex = new THREE.CanvasTexture(canvas);

  const group = new THREE.Group();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 11),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  screen.position.y = 7.5;
  group.add(screen);

  // stand
  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 4, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x222222 }),
  );
  stand.position.y = 2;
  group.add(stand);

  const caption = textSprite("Doppelspalt — |ψ₁+ψ₂|²", "#aaeeff", 5);
  caption.position.y = 14.5;
  group.add(caption);

  group.position.set(pos.x, 0, pos.z);

  const img = ctx.createImageData(W, H);
  const s1 = { x: W * 0.5 - 9, y: -14 };
  const s2 = { x: W * 0.5 + 9, y: -14 };
  const k = 1.15; // wavenumber

  let lastDraw = 0;
  return {
    group,
    update(t: number) {
      // 10 fps is plenty for a wave that breathes
      if (t - lastDraw < 0.1) return;
      lastDraw = t;
      const data = img.data;
      const phase = t * 2.0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const r1 = Math.hypot(x - s1.x, y - s1.y);
          const r2 = Math.hypot(x - s2.x, y - s2.y);
          // two coherent point sources, 1/√r amplitude falloff
          const a1 = Math.cos(k * r1 - phase) / Math.sqrt(Math.max(6, r1));
          const a2 = Math.cos(k * r2 - phase) / Math.sqrt(Math.max(6, r2));
          const I = (a1 + a2) ** 2 * 900;
          const i = (y * W + x) * 4;
          data[i] = Math.min(255, I * 0.35);
          data[i + 1] = Math.min(255, I * 0.85);
          data[i + 2] = Math.min(255, I);
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      tex.needsUpdate = true;
    },
  };
}

import * as THREE from "three";
import { NUERNBERG_STREETS } from "./CityLayout";
import { ROADS } from "./NuernbergMap";

// There are two independent road networks in this codebase: NUERNBERG_STREETS
// (the traffic-AI graph) and ROADS (the actual drivable pavement drawn by
// Engine3D's drawRoads()). Anything that avoids "the road" has to check both,
// or it'll straddle whichever one it forgot.
type RoadSegment = {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  halfWidth: number;
};
const ALL_ROAD_SEGMENTS: RoadSegment[] = [
  ...NUERNBERG_STREETS.map((s) => ({
    ax: s.start.x,
    az: s.start.z,
    bx: s.end.x,
    bz: s.end.z,
    halfWidth: s.width / 2,
  })),
  ...ROADS.flatMap((r) =>
    r.points.slice(0, -1).map((p, i) => ({
      ax: p.x,
      az: p.z,
      bx: r.points[i + 1].x,
      bz: r.points[i + 1].z,
      halfWidth: r.width / 2,
    })),
  ),
];

export function createSignTexture(
  text: string,
  color: string,
  bgColor: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = color;
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 64);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 118);
  }
  return new THREE.MeshLambertMaterial({
    map: new THREE.CanvasTexture(canvas),
  });
}

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

function resolveLayoutPosition(obj: {
  type: string;
  x: number;
  z: number;
  w?: number;
  d?: number;
}): { x: number; z: number } {
  const width = obj.w ?? (obj.type === "church" ? 30 : 20);
  const depth = obj.d ?? (obj.type === "church" ? 60 : 20);
  let centerX = obj.x;
  let centerZ = obj.z;

  for (let pass = 0; pass < 2; pass++) {
    let nearest: {
      dist: number;
      cx: number;
      cz: number;
      roadHalfWidth: number;
      dx: number;
      dz: number;
    } | null = null;

    for (const seg of ALL_ROAD_SEGMENTS) {
      const dx = seg.bx - seg.ax;
      const dz = seg.bz - seg.az;
      const roadHalfWidth = seg.halfWidth;
      const objectHalfSpan =
        Math.abs(dx) >= Math.abs(dz) ? depth / 2 : width / 2;
      const neededDistance = roadHalfWidth + objectHalfSpan + 2;
      const dist = distancePointToSegment(
        centerX,
        centerZ,
        seg.ax,
        seg.az,
        seg.bx,
        seg.bz,
      );

      if (dist < neededDistance) {
        const segDx = seg.bx - seg.ax;
        const segDz = seg.bz - seg.az;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((centerX - seg.ax) * segDx + (centerZ - seg.az) * segDz) /
              (segDx * segDx + segDz * segDz || 1),
          ),
        );
        const cx = seg.ax + segDx * t;
        const cz = seg.az + segDz * t;

        if (!nearest || dist < nearest.dist) {
          nearest = {
            dist,
            cx,
            cz,
            roadHalfWidth,
            dx: segDx,
            dz: segDz,
          };
        }
      }
    }

    if (!nearest) break;

    let awayX = centerX - nearest.cx;
    let awayZ = centerZ - nearest.cz;
    if (awayX === 0 && awayZ === 0) {
      awayX = -nearest.dz;
      awayZ = nearest.dx;
    }

    const len = Math.hypot(awayX, awayZ) || 1;
    const objectHalfSpan =
      Math.abs(nearest.dx) >= Math.abs(nearest.dz) ? depth / 2 : width / 2;
    const neededDistance = nearest.roadHalfWidth + objectHalfSpan + 2;
    const push = neededDistance - nearest.dist + 1;
    centerX += (awayX / len) * push;
    centerZ += (awayZ / len) * push;
  }

  return { x: centerX, z: centerZ };
}

export const MAP_LAYOUT = [
  // Grove St
  {
    type: "player_house",
    x: 0,
    z: 20,
    w: 20,
    h: 15,
    d: 20,
    color: 0x8b4513,
    rot: 0,
  },
  {
    type: "house",
    x: -40,
    z: 20,
    w: 18,
    h: 14,
    d: 18,
    color: 0xa0522d,
    rot: 0.2,
  },
  {
    type: "house",
    x: 40,
    z: 20,
    w: 22,
    h: 16,
    d: 20,
    color: 0xcd853f,
    rot: -0.2,
  },
  {
    type: "house",
    x: -30,
    z: 60,
    w: 20,
    h: 15,
    d: 20,
    color: 0x8b4513,
    rot: Math.PI / 2,
  },
  {
    type: "house",
    x: 30,
    z: 60,
    w: 20,
    h: 15,
    d: 20,
    color: 0xa0522d,
    rot: -Math.PI / 2,
  },
  // Downtown
  {
    type: "business",
    text: "LIQUOR",
    x: -80,
    z: -100,
    w: 40,
    h: 25,
    d: 30,
    color: 0x555555,
    signColor: "#ff0000",
    signBg: "#220000",
  },
  {
    type: "business",
    text: "PAWN",
    x: 0,
    z: -120,
    w: 30,
    h: 20,
    d: 30,
    color: 0x666666,
    signColor: "#ffff00",
    signBg: "#333300",
  },
  {
    type: "wormhole",
    text: "THE WORMHOLE",
    x: 80,
    z: -100,
    w: 50,
    h: 35,
    d: 40,
    color: 0x222222,
    signColor: "#00ff00",
    signBg: "#001100",
  },
  { type: "church", x: -120, z: 50 },
];

export function initWorld(
  scene: THREE.Scene,
  colliders: THREE.Mesh[],
  interactables: any[],
) {
  // Lighting
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(100, 150, 100);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.left = -200;
  sun.shadow.camera.right = 200;
  sun.shadow.camera.top = 200;
  sun.shadow.camera.bottom = -200;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x404040, 0.6));

  // Ground — sized for the metropolitan region: the core city plus the
  // real-world OSM districts (Fürth, Erlangen, Nürnberg Altstadt, Berlin
  // Mitte) which sit 1200–3400 units out. Franconia is grass all the way.
  const grassGeo = new THREE.PlaneGeometry(9000, 9000);
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  const asphaltGeo = new THREE.PlaneGeometry(1000, 1000);
  const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const asphalt = new THREE.Mesh(asphaltGeo, asphaltMat);
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.y = -0.1;
  asphalt.receiveShadow = true;
  scene.add(asphalt);

  MAP_LAYOUT.forEach((obj) => {
    const resolved = resolveLayoutPosition(obj);

    if (obj.type === "house") {
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(obj.w, obj.h, obj.d),
        new THREE.MeshLambertMaterial({ color: obj.color }),
      );
      base.position.y = obj.h! / 2;
      group.add(base);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(obj.w! * 0.8, 10, 4),
        new THREE.MeshLambertMaterial({ color: 0x333333 }),
      );
      roof.position.y = obj.h! + 5;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      group.position.set(resolved.x, 0, resolved.z);
      if (obj.rot) group.rotation.y = obj.rot;
      scene.add(group);

      const proxy = new THREE.Mesh(new THREE.BoxGeometry(obj.w, obj.h, obj.d));
      proxy.position.copy(group.position);
      proxy.position.y = obj.h! / 2;
      proxy.userData = { width: obj.w, depth: obj.d };
      colliders.push(proxy);
    } else if (obj.type === "player_house") {
      const group = new THREE.Group();
      // Walls
      const wallMat = new THREE.MeshLambertMaterial({
        color: 0x8b4513,
        side: THREE.DoubleSide,
      });
      const back = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 1), wallMat);
      back.position.set(0, 7.5, -10);
      group.add(back);
      const left = new THREE.Mesh(new THREE.BoxGeometry(1, 15, 20), wallMat);
      left.position.set(-10, 7.5, 0);
      group.add(left);
      const right = new THREE.Mesh(new THREE.BoxGeometry(1, 15, 20), wallMat);
      right.position.set(10, 7.5, 0);
      group.add(right);
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(20, 1, 20),
        new THREE.MeshLambertMaterial({ color: 0x553311 }),
      );
      floor.position.y = 0.5;
      group.add(floor);
      // Roof
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(18, 10, 4),
        new THREE.MeshLambertMaterial({ color: 0x333333 }),
      );
      roof.position.y = 20;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      // Props
      const tvGroup = new THREE.Group();
      const tvBase = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3, 1),
        new THREE.MeshLambertMaterial({ color: 0x111111 }),
      );
      tvBase.position.set(0, 3, -8);
      tvGroup.add(tvBase);
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 2.5, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x222222, emissive: 0x111111 }),
      );
      screen.position.set(0, 3, -7.4);
      tvGroup.add(screen);
      group.add(tvGroup);
      group.position.set(resolved.x, 0, resolved.z);
      scene.add(group);

      interactables.push({
        type: "tv",
        mesh: tvGroup,
        pos: new THREE.Vector3(0, 0, -8).add(group.position),
      });
      interactables.push({
        type: "roof",
        mesh: roof,
        housePos: group.position,
        dims: { w: 20, d: 20 },
      });
      // In the church creation section, make sure this line exists:
      interactables.push({
        type: "altar",
        pos: new THREE.Vector3(-120, 0, 25).add(group.position), // Adjust position as needed
      });
    } else if (obj.type === "wormhole") {
      // Enterable Bar
      const group = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({
        color: obj.color,
        side: THREE.DoubleSide,
      });
      const back = new THREE.Mesh(new THREE.BoxGeometry(obj.w, obj.h, 1), mat);
      back.position.set(0, obj.h! / 2, -obj.d! / 2);
      group.add(back);
      const left = new THREE.Mesh(new THREE.BoxGeometry(1, obj.h, obj.d), mat);
      left.position.set(-obj.w! / 2, obj.h! / 2, 0);
      group.add(left);
      const right = new THREE.Mesh(new THREE.BoxGeometry(1, obj.h, obj.d), mat);
      right.position.set(obj.w! / 2, obj.h! / 2, 0);
      group.add(right);
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(obj.w, 1, obj.d),
        new THREE.MeshLambertMaterial({ color: 0x110011 }),
      );
      floor.position.y = 0.5;
      group.add(floor);
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(obj.w, 1, obj.d),
        new THREE.MeshLambertMaterial({ color: 0x333333 }),
      );
      roof.position.y = obj.h!;
      group.add(roof);
      if (obj.text) {
        const sign = new THREE.Mesh(
          new THREE.BoxGeometry(obj.w! - 2, 6, 1),
          createSignTexture(obj.text, obj.signColor!, obj.signBg!),
        );
        sign.position.set(0, obj.h! + 4, obj.d! / 2);
        group.add(sign);
      }
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(20, 4, 4),
        new THREE.MeshLambertMaterial({ color: 0x550055 }),
      );
      counter.position.set(0, 2, -10);
      group.add(counter);
      group.position.set(resolved.x, 0, resolved.z);
      scene.add(group);
      interactables.push({
        type: "roof",
        mesh: roof,
        housePos: group.position,
        dims: { w: obj.w, d: obj.d },
      });
      colliders.push(back, left, right);
    } else if (obj.type === "church") {
      // DETAILED CHURCH INTERIOR
      const group = new THREE.Group();

      // Floor
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(30, 1, 60),
        new THREE.MeshLambertMaterial({ color: 0x999999 }),
      );
      floor.position.y = 0.5;
      group.add(floor);
      // Red Carpet
      const carpet = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1.2, 50),
        new THREE.MeshLambertMaterial({ color: 0x880000 }),
      );
      carpet.position.y = 0.6;
      group.add(carpet);

      // Walls
      const wallMat = new THREE.MeshLambertMaterial({
        color: 0xdddddd,
        side: THREE.DoubleSide,
      });
      // Back Wall (Altar side)
      const back = new THREE.Mesh(new THREE.BoxGeometry(30, 20, 1), wallMat);
      back.position.set(0, 10, -30);
      group.add(back);
      // Side Walls
      const left = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 60), wallMat);
      left.position.set(-15, 10, 0);
      group.add(left);
      const right = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 60), wallMat);
      right.position.set(15, 10, 0);
      group.add(right);

      // Roof (The part that hides)
      const mainRoof = new THREE.Mesh(
        new THREE.ConeGeometry(25, 15, 4),
        new THREE.MeshLambertMaterial({ color: 0x222222 }),
      );
      mainRoof.position.set(0, 25, 0);
      mainRoof.rotation.y = Math.PI / 4;
      mainRoof.scale.z = 2; // Stretch it
      group.add(mainRoof);

      // Steeple (Always visible)
      const steeple = new THREE.Group();
      const sBase = new THREE.Mesh(
        new THREE.BoxGeometry(10, 30, 10),
        new THREE.MeshLambertMaterial({ color: 0xdddddd }),
      );
      sBase.position.set(0, 15, 25);
      steeple.add(sBase);
      const sTop = new THREE.Mesh(
        new THREE.ConeGeometry(7, 15, 4),
        new THREE.MeshLambertMaterial({ color: 0x222222 }),
      );
      sTop.position.set(0, 35, 25);
      sTop.rotation.y = Math.PI / 4;
      steeple.add(sTop);
      group.add(steeple);

      // Interior Props: Pews
      for (let z = 10; z < 40; z += 8) {
        // Left Pew
        const pewL = new THREE.Mesh(
          new THREE.BoxGeometry(10, 2, 4),
          new THREE.MeshLambertMaterial({ color: 0x5c4033 }),
        );
        pewL.position.set(-8, 1.5, z - 20);
        group.add(pewL);
        // Right Pew
        const pewR = new THREE.Mesh(
          new THREE.BoxGeometry(10, 2, 4),
          new THREE.MeshLambertMaterial({ color: 0x5c4033 }),
        );
        pewR.position.set(8, 1.5, z - 20);
        group.add(pewR);
      }

      // Altar
      const altar = new THREE.Mesh(
        new THREE.BoxGeometry(8, 4, 4),
        new THREE.MeshLambertMaterial({ color: 0xffd700 }),
      );
      altar.position.set(0, 2, -25);
      group.add(altar);

      group.position.set(resolved.x, 0, resolved.z);
      scene.add(group);

      // Colliders
      colliders.push(back, left, right);

      // Interactables
      interactables.push({
        type: "roof",
        mesh: mainRoof,
        housePos: group.position,
        dims: { w: 30, d: 60 },
      });
      interactables.push({
        type: "altar",
        pos: new THREE.Vector3(0, 0, -25).add(group.position),
      });
    } else if (obj.type === "business" && obj.text) {
      const mat = new THREE.MeshLambertMaterial({ color: obj.color });
      const signMat = createSignTexture(obj.text, obj.signColor!, obj.signBg!);
      const materials = [mat, mat, mat, mat, mat, signMat];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(obj.w, obj.h, obj.d),
        materials,
      );
      mesh.position.set(resolved.x, obj.h! / 2, resolved.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { width: obj.w, depth: obj.d };
      scene.add(mesh);
      colliders.push(mesh);
    }
  });

  // Trees
  for (let i = 0; i < 20; i++) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.5, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x4d3319 }),
    );
    trunk.position.y = 4;
    tree.add(trunk);
    const leaves = new THREE.Mesh(
      new THREE.DodecahedronGeometry(6),
      new THREE.MeshLambertMaterial({ color: 0x2d5a27 }),
    );
    leaves.position.y = 10;
    tree.add(leaves);

    // pick a spot off every road we know about (retry, don't push — a tree
    // that's still in the way after 12 tries just sits this round out)
    let tx = 0,
      tz = 0,
      placed = false;
    for (let tries = 0; tries < 12 && !placed; tries++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 80;
      tx = Math.cos(angle) * r;
      tz = Math.sin(angle) * r;
      placed = !ALL_ROAD_SEGMENTS.some(
        (seg) =>
          distancePointToSegment(tx, tz, seg.ax, seg.az, seg.bx, seg.bz) <
          seg.halfWidth + 4,
      );
    }
    if (!placed) continue; // couldn't find clear ground, skip this tree

    tree.position.set(tx, 0, tz);
    tree.castShadow = true;
    scene.add(tree);
    const proxy = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2));
    proxy.position.copy(tree.position);
    proxy.userData = { width: 2, depth: 2 };
    colliders.push(proxy);
  }
}

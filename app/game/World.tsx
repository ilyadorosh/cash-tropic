import * as THREE from "three";

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

  // Ground
  const grassGeo = new THREE.PlaneGeometry(300, 300);
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
      group.position.set(obj.x, 0, obj.z);
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
      group.position.set(obj.x, 0, obj.z);
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
      group.position.set(obj.x, 0, obj.z);
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

      group.position.set(obj.x, 0, obj.z);
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
      mesh.position.set(obj.x, obj.h! / 2, obj.z);
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
    const angle = Math.random() * Math.PI * 2;
    const r = 40 + Math.random() * 80;
    tree.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    tree.castShadow = true;
    scene.add(tree);
    const proxy = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2));
    proxy.position.copy(tree.position);
    proxy.userData = { width: 2, depth: 2 };
    colliders.push(proxy);
  }
}

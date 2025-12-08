"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DialogueData {
  title: string;
  text: string;
}

interface Stats {
  speed: number;
  health: number;
  money: number;
  wanted: number;
  mission?: number;
}

export default function GTAGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<Stats>({ speed: 0, health: 100, money: 0, wanted: 0, mission: 0 });
  const [dialogue, setDialogue] = useState<DialogueData | null>(null);
  const [cutscene, setCutscene] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 800);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    if (!mountRef.current) return;
    
    // Lighting
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x404040, 1));

    // Ground
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid roads
    for (let i = -500; i <= 500; i += 50) {
      const roadGeo = new THREE.PlaneGeometry(1000, 10);
      const roadMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(i, 0.01, 0);
      road.receiveShadow = true;
      scene.add(road);

      // Road lines
      const lineGeo = new THREE.PlaneGeometry(1000, 0.3);
      const lineMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(i, 0.02, 0);
      scene.add(line);

      const road2 = new THREE.Mesh(roadGeo, roadMat);
      road2.rotation.x = -Math.PI / 2;
      road2.rotation.z = Math.PI / 2;
      road2.position.set(0, 0.01, i);
      road2.receiveShadow = true;
      scene.add(road2);

      const line2 = new THREE.Mesh(lineGeo, lineMat);
      line2.rotation.x = -Math.PI / 2;
      line2.rotation.z = Math.PI / 2;
      line2.position.set(0, 0.02, i);
      scene.add(line2);
    }

    // Skyscrapers (LA/SF style)
    const buildings: Array<THREE.Mesh> = [];
    const skyscraperStyles = [
      { color: 0x1a1a2e, windows: 0x4a90e2 }, // Dark blue glass
      { color: 0x2d2d2d, windows: 0xffa500 }, // Black with orange
      { color: 0x8b4513, windows: 0xffff99 }, // Brown brick
      { color: 0x4a4a4a, windows: 0x87ceeb }, // Gray modern
      { color: 0x1c1c1c, windows: 0x00ff00 }, // Matrix green
    ];

    for (let i = 0; i < 80; i++) {
      const w = 20 + Math.random() * 30;
      const h = i < 20 ? 100 + Math.random() * 200 : 30 + Math.random() * 80; // Some very tall
      const d = 20 + Math.random() * 30;
      
      const style = skyscraperStyles[Math.floor(Math.random() * skyscraperStyles.length)];
      const buildingGeo = new THREE.BoxGeometry(w, h, d);
      const buildingMat = new THREE.MeshLambertMaterial({ color: style.color });
      const building = new THREE.Mesh(buildingGeo, buildingMat);
      
      let x = (Math.random() - 0.5) * 900;
      let z = (Math.random() - 0.5) * 900;
      x = Math.round(x / 50) * 50 + (Math.random() > 0.5 ? 25 : -25);
      z = Math.round(z / 50) * 50 + (Math.random() > 0.5 ? 25 : -25);
      
      building.position.set(x, h / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      building.userData = { width: w, depth: d };
      scene.add(building);
      buildings.push(building);

      // Windows
      const windowsPerFloor = Math.floor(Math.max(w, d) / 3);
      const floors = Math.floor(h / 5);
      for (let f = 0; f < floors; f++) {
        for (let win = 0; win < windowsPerFloor; win++) {
          if (Math.random() > 0.3) {
            const windowGeo = new THREE.PlaneGeometry(1.5, 2);
            const windowMat = new THREE.MeshStandardMaterial({ 
              color: style.windows,
              emissive: style.windows,
              emissiveIntensity: 0.5
            });
            const window1 = new THREE.Mesh(windowGeo, windowMat);
            window1.position.set(
              x + w/2 + 0.01,
              f * 5 + 3,
              z - d/2 + (win * 3) + 2
            );
            window1.rotation.y = Math.PI / 2;
            scene.add(window1);
          }
        }
      }
    }

    // Car (player)
    const carGroup = new THREE.Group();
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 8),
      new THREE.MeshLambertMaterial({ color: 0xff0000 })
    );
    carBody.position.y = 1.5;
    carBody.castShadow = true;
    carGroup.add(carBody);

    const carTop = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 4),
      new THREE.MeshLambertMaterial({ color: 0xff0000 })
    );
    carTop.position.set(0, 2.75, -0.5);
    carTop.castShadow = true;
    carGroup.add(carTop);

    const wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const wheelPositions: [number, number, number][] = [
      [-2, 0.8, 2.5], [2, 0.8, 2.5],
      [-2, 0.8, -2.5], [2, 0.8, -2.5]
    ];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      carGroup.add(wheel);
    });

    carGroup.position.set(0, 0, 0);
    scene.add(carGroup);

    // Police cars
    const policeCars: Array<{ mesh: THREE.Group; speed: number; lights: THREE.Mesh[] }> = [];
    function spawnPoliceCar() {
      const pc = new THREE.Group();
      const pcBody = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 8),
        new THREE.MeshLambertMaterial({ color: 0x000000 })
      );
      pcBody.position.y = 1.5;
      pcBody.castShadow = true;
      pc.add(pcBody);

      const pcTop = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 4),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      pcTop.position.set(0, 2.75, -0.5);
      pcTop.castShadow = true;
      pc.add(pcTop);

      // Police lights
      const light1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 })
      );
      light1.position.set(-0.7, 3.5, -0.5);
      pc.add(light1);

      const light2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff })
      );
      light2.position.set(0.7, 3.5, -0.5);
      pc.add(light2);

      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 50;
      pc.position.set(
        carGroup.position.x + Math.cos(angle) * dist,
        0,
        carGroup.position.z + Math.sin(angle) * dist
      );
      scene.add(pc);
      return { mesh: pc, speed: 0, lights: [light1, light2] };
    }

    // Pedestrians
    const pedestrians: Array<{ mesh: THREE.Group; speed: number; changeTimer: number }> = [];
    for (let i = 0; i < 40; i++) {
      const pedGroup = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 3, 0.8),
        new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
      );
      body.position.y = 1.5;
      body.castShadow = true;
      pedGroup.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xffdbac })
      );
      head.position.y = 3.5;
      head.castShadow = true;
      pedGroup.add(head);

      let x = (Math.random() - 0.5) * 400;
      let z = (Math.random() - 0.5) * 400;
      pedGroup.position.set(x, 0, z);
      pedGroup.rotation.y = Math.random() * Math.PI * 2;
      scene.add(pedGroup);
      pedestrians.push({ 
        mesh: pedGroup, 
        speed: 0.05 + Math.random() * 0.05,
        changeTimer: Math.random() * 100
      });
    }

    // Traffic cars
    const trafficCars: Array<{ mesh: THREE.Group; speed: number }> = [];
    for (let i = 0; i < 20; i++) {
      const tc = new THREE.Group();
      const tcBody = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 8),
        new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
      );
      tcBody.position.y = 1.5;
      tcBody.castShadow = true;
      tc.add(tcBody);

      const tcTop = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 4),
        new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
      );
      tcTop.position.set(0, 2.75, -0.5);
      tcTop.castShadow = true;
      tc.add(tcTop);

      let x = (Math.random() - 0.5) * 400;
      let z = (Math.random() - 0.5) * 400;
      tc.position.set(x, 0, z);
      tc.rotation.y = Math.floor(Math.random() * 4) * Math.PI / 2;
      scene.add(tc);
      trafficCars.push({ mesh: tc, speed: 0.3 + Math.random() * 0.5 });
    }

    // Mission markers (VC style purple cylinders)
    interface Mission {
      pos: [number, number, number];
      name: string;
      npcColor: number;
      dialogue: string[];
    }
    const missions: Mission[] = [
      { 
        pos: [150, 0, 150], 
        name: "Morpheus",
        npcColor: 0x000088,
        dialogue: [
          "I've been searching for you for a long time.",
          "You're living in a prison that you cannot smell, taste, or touch.",
          "A prison for your mind, built by bills and rent.",
          "But I can show you the door. You must walk through it yourself.",
          "Complete this task: Drive to the three green markers.",
          "Collect $500. Then return to me.",
          "This is your first step toward freedom."
        ]
      },
      { 
        pos: [-180, 0, -180], 
        name: "Trinity",
        npcColor: 0x004400,
        dialogue: [
          "The system is watching you now.",
          "They know you're awake. They'll try to stop you.",
          "But remember: they are still bound by rules.",
          "You are not.",
          "I need you to evade them. Get a wanted level, then lose it.",
          "Show me you can bend the rules without breaking yourself.",
          "Only then will you be ready for what comes next."
        ]
      },
      { 
        pos: [250, 0, -250], 
        name: "The Architect",
        npcColor: 0x666666,
        dialogue: [
          "You've done well to make it this far.",
          "But do you understand what you're fighting against?",
          "The system isn't evil. It's efficient. Cold. Mathematical.",
          "It processes millions like you every day.",
          "Your rebellion is... an anomaly. But perhaps a necessary one.",
          "There is a shelter on the far side of town.",
          "Reach it, and you'll find others like you. Your new family.",
          "This is the last choice I can offer you."
        ]
      }
    ];

    const missionMarkers: Array<{ marker: THREE.Mesh; beam: THREE.Mesh; collected: boolean; mission: Mission; index: number }> = [];
    const missionNPCs: THREE.Group[] = [];
    missions.forEach((mission, idx) => {
      // Purple cylinder marker (VC style)
      const markerGeo = new THREE.CylinderGeometry(2, 2, 0.2, 32);
      const markerMat = new THREE.MeshStandardMaterial({ 
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(mission.pos[0], 0.1, mission.pos[2]);
      scene.add(marker);

      // Vertical glow beam
      const beamGeo = new THREE.CylinderGeometry(2.5, 2.5, 50, 32, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({ 
        color: 0xff00ff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(mission.pos[0], 25, mission.pos[2]);
      scene.add(beam);

      // NPC character
      const npcGroup = new THREE.Group();
      const npcBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 3.5, 1),
        new THREE.MeshLambertMaterial({ color: mission.npcColor })
      );
      npcBody.position.y = 1.75;
      npcBody.castShadow = true;
      npcGroup.add(npcBody);

      const npcHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xffdbac })
      );
      npcHead.position.y = 4;
      npcHead.castShadow = true;
      npcGroup.add(npcHead);

      // Sunglasses (Matrix style)
      const glassesGeo = new THREE.BoxGeometry(1, 0.3, 0.2);
      const glassesMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
      const glasses = new THREE.Mesh(glassesGeo, glassesMat);
      glasses.position.set(0, 4, 0.4);
      npcGroup.add(glasses);

      npcGroup.position.set(mission.pos[0], 0, mission.pos[2]);
      scene.add(npcGroup);

      missionMarkers.push({ marker, beam, collected: false, mission, index: idx });
      missionNPCs.push(npcGroup);
    });

    // Money pickups
    const moneyPickups: Array<{ mesh: THREE.Mesh; collected: boolean; value: number }> = [];
    for (let i = 0; i < 20; i++) {
      const money = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.1, 2),
        new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00 })
      );
      money.position.set(
        (Math.random() - 0.5) * 400,
        1,
        (Math.random() - 0.5) * 400
      );
      money.rotation.x = Math.PI / 2;
      scene.add(money);
      moneyPickups.push({ mesh: money, collected: false, value: 25 });
    }

    // Matrix rain effect
    const matrixRain: Array<{ mesh: THREE.Mesh; speed: number }> = [];
    for (let i = 0; i < 100; i++) {
      const rainGeo = new THREE.PlaneGeometry(0.5, 10);
      const rainMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const rain = new THREE.Mesh(rainGeo, rainMat);
      rain.position.set(
        (Math.random() - 0.5) * 1000,
        Math.random() * 100 + 50,
        (Math.random() - 0.5) * 1000
      );
      rain.visible = false;
      scene.add(rain);
      matrixRain.push({ mesh: rain, speed: 1 + Math.random() * 2 });
    }

    // Game state
    const keys: Record<string, boolean> = {};
    const velocity = new THREE.Vector3();
    let speed = 0;
    const maxSpeed = 1.5;
    const acceleration = 0.03;
    const deceleration = 0.02;
    const turnSpeed = 0.04;
    let health = 100;
    let money = 0;
    let wantedLevel = 0;
    let wantedTimer = 0;
    let missionCount = 0;
    let currentDialogue: { title: string; lines: string[] } | null = null;
    let dialogueIndex = 0;
    let inCutscene = false;
    let cutsceneTimer = 0;
    let currentNPC: THREE.Group | null = null;

    // Controls
    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      
      if (e.key === ' ' && currentDialogue && !inCutscene) {
        dialogueIndex++;
        if (dialogueIndex >= currentDialogue.lines.length) {
          setDialogue(null);
          setCutscene(false);
          currentDialogue = null;
          dialogueIndex = 0;
          inCutscene = false;
          
          // Enable matrix rain after first mission
          if (missionCount >= 1) {
            matrixRain.forEach(r => r.mesh.visible = true);
          }
        } else {
          setDialogue({
            title: currentDialogue?.title || '',
            text: currentDialogue?.lines[dialogueIndex] || ''
          });
        }
      }
    });
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    // Collision detection
    function checkCollision(obj1Pos: THREE.Vector3, obj1Size: { x: number; z: number }, obj2Pos: THREE.Vector3, obj2Size: { x: number; z: number }): boolean {
      return Math.abs(obj1Pos.x - obj2Pos.x) < (obj1Size.x + obj2Size.x) / 2 &&
             Math.abs(obj1Pos.z - obj2Pos.z) < (obj1Size.z + obj2Size.z) / 2;
    }

    // Camera offset
    const cameraOffset = new THREE.Vector3(0, 8, -20);
    let cutsceneCameraPos = new THREE.Vector3();
    let cutsceneCameraTarget = new THREE.Vector3();

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      if (!inCutscene) {
        // Car physics
        if (keys['w'] || keys['arrowup']) {
          speed = Math.min(speed + acceleration, maxSpeed);
        } else if (keys['s'] || keys['arrowdown']) {
          speed = Math.max(speed - acceleration, -maxSpeed * 0.5);
        } else {
          if (speed > 0) speed = Math.max(0, speed - deceleration);
          if (speed < 0) speed = Math.min(0, speed + deceleration);
        }

        if (keys['a'] || keys['arrowleft']) {
          carGroup.rotation.y += turnSpeed * Math.abs(speed) / maxSpeed;
        }
        if (keys['d'] || keys['arrowright']) {
          carGroup.rotation.y -= turnSpeed * Math.abs(speed) / maxSpeed;
        }

        // Move car
        velocity.set(0, 0, speed);
        velocity.applyQuaternion(carGroup.quaternion);
        const newPos = carGroup.position.clone().add(velocity);

        let canMove = true;
        buildings.forEach(building => {
          if (checkCollision(newPos, { x: 4, z: 8 }, building.position, 
              { x: building.userData.width, z: building.userData.depth })) {
            canMove = false;
            health = Math.max(0, health - 0.5);
            speed *= -0.3;
          }
        });

        trafficCars.forEach(tc => {
          if (checkCollision(newPos, { x: 4, z: 8 }, tc.mesh.position, { x: 4, z: 8 })) {
            canMove = false;
            health = Math.max(0, health - 1);
            speed *= -0.5;
            wantedLevel = Math.min(5, wantedLevel + 1);
            wantedTimer = 300;
          }
        });

        if (canMove) {
          carGroup.position.copy(newPos);
        }

        // Check pedestrian collisions
        pedestrians.forEach(ped => {
          if (checkCollision(carGroup.position, { x: 4, z: 8 }, ped.mesh.position, { x: 1, z: 0.8 })) {
            health = Math.max(0, health - 2);
            wantedLevel = Math.min(5, wantedLevel + 2);
            wantedTimer = 300;
            const dir = ped.mesh.position.clone().sub(carGroup.position).normalize();
            ped.mesh.position.add(dir.multiplyScalar(3));
          }
        });

        // Wrap boundaries
        if (carGroup.position.x > 500) carGroup.position.x = -500;
        if (carGroup.position.x < -500) carGroup.position.x = 500;
        if (carGroup.position.z > 500) carGroup.position.z = -500;
        if (carGroup.position.z < -500) carGroup.position.z = 500;
      }

      // Wanted level decay
      if (wantedTimer > 0) {
        wantedTimer--;
        if (wantedTimer === 0 && wantedLevel > 0) {
          wantedLevel = Math.max(0, wantedLevel - 1);
          if (wantedLevel > 0) wantedTimer = 300;
        }
      }

      // Police AI
      if (wantedLevel > 0 && policeCars.length < wantedLevel * 2) {
        policeCars.push(spawnPoliceCar());
      }

      policeCars.forEach((pc, idx) => {
        // Flashing lights
        pc.lights[0].material = pc.lights[0].material as THREE.MeshStandardMaterial;
        pc.lights[1].material = pc.lights[1].material as THREE.MeshStandardMaterial;
        (pc.lights[0].material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(Date.now() * 0.01) > 0 ? 1 : 0.2;
        (pc.lights[1].material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(Date.now() * 0.01) < 0 ? 1 : 0.2;

        // Chase player
        const dir = carGroup.position.clone().sub(pc.mesh.position);
        const dist = dir.length();
        
        if (wantedLevel === 0 || dist > 200) {
          scene.remove(pc.mesh);
          policeCars.splice(idx, 1);
          return;
        }

        dir.normalize();
        const angle = Math.atan2(dir.x, dir.z);
        pc.mesh.rotation.y = angle;

        const chaseSpeed = 0.8 + wantedLevel * 0.2;
        pc.mesh.position.add(dir.multiplyScalar(chaseSpeed));

        // Collision with player
        if (dist < 8) {
          health = Math.max(0, health - 0.3);
          const pushDir = carGroup.position.clone().sub(pc.mesh.position).normalize();
          carGroup.position.add(pushDir.multiplyScalar(0.5));
        }
      });

      // Move pedestrians
      pedestrians.forEach(ped => {
        ped.changeTimer--;
        if (ped.changeTimer <= 0) {
          ped.mesh.rotation.y = Math.random() * Math.PI * 2;
          ped.changeTimer = 50 + Math.random() * 100;
        }

        const dir = new THREE.Vector3(0, 0, ped.speed);
        dir.applyQuaternion(ped.mesh.quaternion);
        ped.mesh.position.add(dir);

        if (ped.mesh.position.x > 500) ped.mesh.position.x = -500;
        if (ped.mesh.position.x < -500) ped.mesh.position.x = 500;
        if (ped.mesh.position.z > 500) ped.mesh.position.z = -500;
        if (ped.mesh.position.z < -500) ped.mesh.position.z = 500;
      });

      // Move traffic
      trafficCars.forEach(tc => {
        const dir = new THREE.Vector3(0, 0, tc.speed);
        dir.applyQuaternion(tc.mesh.quaternion);
        tc.mesh.position.add(dir);

        if (tc.mesh.position.x > 500) tc.mesh.position.x = -500;
        if (tc.mesh.position.x < -500) tc.mesh.position.x = 500;
        if (tc.mesh.position.z > 500) tc.mesh.position.z = -500;
        if (tc.mesh.position.z < -500) tc.mesh.position.z = 500;
      });

      // Animate markers
      missionMarkers.forEach(mm => {
        if (!mm.collected) {
          mm.marker.rotation.y += 0.02;
          mm.beam.rotation.y -= 0.01;
          mm.marker.position.y = 0.1 + Math.sin(Date.now() * 0.003) * 0.3;

          const dist = carGroup.position.distanceTo(mm.marker.position);
          if (dist < 5 && !inCutscene) {
            mm.collected = true;
            scene.remove(mm.marker);
            scene.remove(mm.beam);
            missionCount++;
            
            // Start cutscene
            inCutscene = true;
            cutsceneTimer = 0;
            currentNPC = missionNPCs[mm.index];
            
            currentDialogue = {
              title: mm.mission.name,
              lines: mm.mission.dialogue
            };
            dialogueIndex = 0;
            setDialogue({
              title: mm.mission.name,
              text: mm.mission.dialogue[0]
            });
            setCutscene(true);

            // Set cutscene camera
            cutsceneCameraPos.copy(currentNPC.position).add(new THREE.Vector3(5, 3, 5));
            cutsceneCameraTarget.copy(currentNPC.position).add(new THREE.Vector3(0, 2, 0));
          }
        }
      });

      // Collect money
      moneyPickups.forEach(mp => {
        if (!mp.collected) {
          mp.mesh.rotation.y += 0.05;
          const dist = carGroup.position.distanceTo(mp.mesh.position);
          if (dist < 4) {
            mp.collected = true;
            scene.remove(mp.mesh);
            money += mp.value;
          }
        }
      });

      // Matrix rain
      matrixRain.forEach(r => {
        if (r.mesh.visible) {
          r.mesh.position.y -= r.speed;
          if (r.mesh.position.y < 0) {
            r.mesh.position.y = 100;
            r.mesh.position.x = (Math.random() - 0.5) * 1000;
            r.mesh.position.z = (Math.random() - 0.5) * 1000;
          }
        }
      });

      // Camera control
      if (inCutscene) {
        cutsceneTimer++;
        camera.position.lerp(cutsceneCameraPos, 0.05);
        camera.lookAt(cutsceneCameraTarget);
      } else {
        const idealOffset = cameraOffset.clone().applyQuaternion(carGroup.quaternion);
        const idealPos = carGroup.position.clone().add(idealOffset);
        camera.position.lerp(idealPos, 0.1);
        camera.lookAt(carGroup.position);
      }

      setStats({ 
        speed: Math.abs(Math.round(speed * 100)), 
        health: Math.floor(health),
        money: money,
        wanted: wantedLevel,
        mission: missionCount
      });

      renderer.render(scene, camera);
    }

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement as Node);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={mountRef} />
      
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '20px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        border: '2px solid #00ff00'
      }}>
        <div>SPEED: {stats.speed} MPH</div>
        <div style={{ color: stats.health < 30 ? '#ff4444' : 'white' }}>
          HEALTH: {stats.health}%
        </div>
        <div style={{ color: '#00ff00' }}>MONEY: ${stats.money}</div>
        <div>MISSIONS: {stats.mission}/3</div>
        <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>
          WASD / Arrows - Drive
        </div>
      </div>

      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        gap: '5px'
      }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: '30px',
            height: '30px',
            background: i <= stats.wanted ? '#ff0000' : '#333',
            border: '2px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: i <= stats.wanted ? '0 0 10px #ff0000' : 'none'
          }}>
            ★
          </div>
        ))}
      </div>

      {dialogue && (
        <div style={{
          position: 'absolute',
          bottom: cutscene ? '20%' : 40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: '800px',
          background: 'rgba(0,0,0,0.95)',
          border: '3px solid #00ff00',
          borderRadius: '8px',
          padding: '25px',
          color: '#00ff00',
          fontFamily: 'Courier New, monospace',
          fontSize: '18px',
          textShadow: '0 0 10px rgba(0,255,0,0.8)',
          boxShadow: '0 0 30px rgba(0,255,0,0.3)'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '15px',
            fontSize: '22px',
            color: '#00ff00',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            &gt;&gt; {dialogue?.title}
          </div>
          <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
            {dialogue?.text}
          </div>
          <div style={{ 
            marginTop: '20px', 
            fontSize: '14px', 
            opacity: 0.7,
            textAlign: 'right',
            animation: 'blink 1s infinite'
          }}>
            [SPACE to continue]
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ============================================================================
// GROVE STREET 4D - Clean GTA-style city with 4th dimension
// ============================================================================

export default function Game4D() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // === SETUP ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Blue sky
    scene.fog = new THREE.Fog(0x87CEEB, 150, 500);
    
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    // === LIGHTING (warm California sun) ===
    const ambient = new THREE.AmbientLight(0xffeedd, 0.5);
    scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xffffcc, 1.2);
    sun.position.set(100, 150, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    scene.add(sun);
    
    // === CITY CONFIG ===
    const BLOCK_SIZE = 50;
    const ROAD_WIDTH = 12;
    const CELL_SIZE = BLOCK_SIZE + ROAD_WIDTH;
    const GRID_SIZE = 4;
    const CITY_SIZE = GRID_SIZE * CELL_SIZE;
    const W_LAYERS = 3;
    const W_SPACING = 40;
    
    // === GROUND ===
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d5c3d }); // Grass
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // === ROADS ===
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Horizontal roads
      const hRoad = new THREE.Mesh(
        new THREE.BoxGeometry(CITY_SIZE + ROAD_WIDTH, 0.15, ROAD_WIDTH),
        roadMat
      );
      hRoad.position.set(CITY_SIZE / 2, 0.08, i * CELL_SIZE);
      hRoad.receiveShadow = true;
      scene.add(hRoad);
      
      // Vertical roads
      const vRoad = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_WIDTH, 0.15, CITY_SIZE + ROAD_WIDTH),
        roadMat
      );
      vRoad.position.set(i * CELL_SIZE, 0.08, CITY_SIZE / 2);
      vRoad.receiveShadow = true;
      scene.add(vRoad);
      
      // Sidewalks along roads
      [-1, 1].forEach(side => {
        const hSidewalk = new THREE.Mesh(
          new THREE.BoxGeometry(CITY_SIZE + ROAD_WIDTH, 0.2, 2),
          sidewalkMat
        );
        hSidewalk.position.set(CITY_SIZE / 2, 0.1, i * CELL_SIZE + side * (ROAD_WIDTH / 2 + 1));
        scene.add(hSidewalk);
        
        const vSidewalk = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.2, CITY_SIZE + ROAD_WIDTH),
          sidewalkMat
        );
        vSidewalk.position.set(i * CELL_SIZE + side * (ROAD_WIDTH / 2 + 1), 0.1, CITY_SIZE / 2);
        scene.add(vSidewalk);
      });
    }
    
    // Road markings (yellow center lines)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    for (let i = 0; i <= GRID_SIZE; i++) {
      for (let seg = 0; seg < GRID_SIZE * 4; seg++) {
        // Horizontal road lines
        const hLine = new THREE.Mesh(new THREE.BoxGeometry(6, 0.02, 0.2), lineMat);
        hLine.position.set(seg * 10 + 8, 0.17, i * CELL_SIZE);
        scene.add(hLine);
        
        // Vertical road lines
        const vLine = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 6), lineMat);
        vLine.position.set(i * CELL_SIZE, 0.17, seg * 10 + 8);
        scene.add(vLine);
      }
    }
    
    // === BUILDINGS ===
    interface Building {
      mesh: THREE.Mesh;
      wLayer: number;
      baseOpacity: number;
    }
    const buildings: Building[] = [];
    
    const buildingColors = [
      0x8B7355, 0xA08060, 0x9A8070, // Browns/tans
      0x6B5344, 0x705040, 0x5C4033, // Darker browns  
      0xD4C4A8, 0xC2B280, 0xBDB76B, // Light/cream
      0x556B2F, 0x6B8E23,           // Olive/green
    ];
    
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    
    let seed = 42;
    
    // Create buildings for each W layer
    for (let wLayer = 0; wLayer < W_LAYERS; wLayer++) {
      const wOffset = (wLayer - 1) * W_SPACING; // -40, 0, +40
      
      for (let bx = 0; bx < GRID_SIZE; bx++) {
        for (let bz = 0; bz < GRID_SIZE; bz++) {
          const blockX = bx * CELL_SIZE + ROAD_WIDTH / 2;
          const blockZ = bz * CELL_SIZE + ROAD_WIDTH / 2;
          
          // 1-2 buildings per block (sparse city)
          const numBuildings = 1 + Math.floor(seededRandom(seed++) * 1.5);
          
          for (let b = 0; b < numBuildings; b++) {
            const r1 = seededRandom(seed++);
            const r2 = seededRandom(seed++);
            const r3 = seededRandom(seed++);
            const r4 = seededRandom(seed++);
            
            const width = 10 + r1 * 18;
            const depth = 10 + r2 * 18;
            const height = 8 + r3 * 25 + (wLayer === 1 ? 5 : 0); // Center layer taller
            
            const posX = blockX + 3 + r1 * (BLOCK_SIZE - width - 6);
            const posZ = blockZ + 3 + r2 * (BLOCK_SIZE - depth - 6);
            
            const geo = new THREE.BoxGeometry(width, height, depth);
            const colorIdx = Math.floor(r4 * buildingColors.length);
            
            let mat: THREE.Material;
            if (wLayer === 1) {
              // Current layer - solid
              mat = new THREE.MeshLambertMaterial({ 
                color: buildingColors[colorIdx],
                transparent: true,
                opacity: 1
              });
            } else {
              // Other layers - wireframe ghost
              const ghostColor = wLayer === 0 ? 0xff6644 : 0x44ff88;
              mat = new THREE.MeshBasicMaterial({
                color: ghostColor,
                wireframe: true,
                transparent: true,
                opacity: 0.3
              });
            }
            
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(posX + width/2, height/2, posZ + depth/2);
            mesh.castShadow = wLayer === 1;
            mesh.receiveShadow = wLayer === 1;
            
            scene.add(mesh);
            buildings.push({ mesh, wLayer, baseOpacity: wLayer === 1 ? 1 : 0.3 });
          }
        }
      }
    }
    
    // === PLAYER CAR ===
    const carGroup = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(2.2, 0.9, 4.5);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x228833 }); // Grove green
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    carGroup.add(body);
    
    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
    const cabinMat = new THREE.MeshLambertMaterial({ color: 0x1a6628 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.15, -0.3);
    carGroup.add(cabin);
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    [[1.1, 0.35, 1.3], [-1.1, 0.35, 1.3], [1.1, 0.35, -1.3], [-1.1, 0.35, -1.3]].forEach(p => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p[0], p[1], p[2]);
      carGroup.add(wheel);
    });
    
    // Lights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    [[-0.7, 0.55, 2.26], [0.7, 0.55, 2.26]].forEach(p => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.05), headlightMat);
      hl.position.set(p[0], p[1], p[2]);
      carGroup.add(hl);
    });
    [[-0.7, 0.55, -2.26], [0.7, 0.55, -2.26]].forEach(p => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.05), taillightMat);
      tl.position.set(p[0], p[1], p[2]);
      carGroup.add(tl);
    });
    
    carGroup.position.set(CELL_SIZE * 2, 0, CELL_SIZE * 2);
    scene.add(carGroup);
    
    // === HUD ===
    const hud = document.createElement('div');
    hud.style.cssText = `
      position: fixed; top: 20px; left: 20px;
      font-family: 'Arial', sans-serif; font-size: 14px;
      color: #fff; background: rgba(0,0,0,0.75);
      padding: 15px 20px; border-radius: 8px;
      border-left: 4px solid #228833;
      pointer-events: none; z-index: 100;
    `;
    document.body.appendChild(hud);
    
    // === MINIMAP ===
    const mapSize = 160;
    const mapDiv = document.createElement('div');
    mapDiv.style.cssText = `
      position: fixed; bottom: 20px; left: 20px;
      width: ${mapSize}px; height: ${mapSize}px;
      border: 3px solid #228833; border-radius: 8px;
      overflow: hidden; z-index: 100; background: #1a3a1a;
    `;
    document.body.appendChild(mapDiv);
    
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = mapSize;
    mapCanvas.height = mapSize;
    mapDiv.appendChild(mapCanvas);
    const ctx = mapCanvas.getContext('2d')!;
    
    // === STATE ===
    const state = {
      x: CELL_SIZE * 2,
      z: CELL_SIZE * 2,
      w: 0,
      speed: 0,
      angle: 0,
      camYaw: 0,
      camPitch: 0.35,
      camDist: 12
    };
    
    const keys: Record<string, boolean> = {};
    window.onkeydown = e => { keys[e.key.toLowerCase()] = true; if(e.key === ' ') e.preventDefault(); };
    window.onkeyup = e => keys[e.key.toLowerCase()] = false;
    
    renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());
    document.addEventListener('mousemove', e => {
      if (document.pointerLockElement === renderer.domElement) {
        state.camYaw -= e.movementX * 0.003;
        state.camPitch = Math.max(0.1, Math.min(1.0, state.camPitch + e.movementY * 0.003));
      }
    });
    renderer.domElement.addEventListener('wheel', e => {
      e.preventDefault();
      state.camDist = Math.max(5, Math.min(30, state.camDist + e.deltaY * 0.015));
    }, { passive: false });
    
    // === MINIMAP DRAW ===
    function drawMinimap() {
      const scale = mapSize / CITY_SIZE;
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(0, 0, mapSize, mapSize);
      
      // Roads
      ctx.fillStyle = '#444';
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.fillRect(0, i * CELL_SIZE * scale - 3, mapSize, 6);
        ctx.fillRect(i * CELL_SIZE * scale - 3, 0, 6, mapSize);
      }
      
      // Buildings (current layer only)
      ctx.fillStyle = '#665';
      buildings.filter(b => b.wLayer === 1).forEach(b => {
        const g = b.mesh.geometry as THREE.BoxGeometry;
        const w = g.parameters.width * scale;
        const d = g.parameters.depth * scale;
        ctx.fillRect(b.mesh.position.x * scale - w/2, b.mesh.position.z * scale - d/2, w, d);
      });
      
      // Car
      ctx.save();
      ctx.translate(state.x * scale, state.z * scale);
      ctx.rotate(state.angle);
      ctx.fillStyle = '#2a2';
      ctx.fillRect(-2.5, -4, 5, 8);
      ctx.fillStyle = '#ff0';
      ctx.fillRect(-1.5, -4.5, 3, 1);
      ctx.restore();
    }
    
    // === GAME LOOP ===
    function animate() {
      requestAnimationFrame(animate);
      
      // Steering
      const turnRate = 0.05 * Math.min(1, Math.abs(state.speed) * 2);
      if (keys['a'] || keys['arrowleft']) state.angle += turnRate;
      if (keys['d'] || keys['arrowright']) state.angle -= turnRate;
      
      // Acceleration
      if (keys['w'] || keys['arrowup']) state.speed = Math.min(state.speed + 0.08, 1.5);
      else if (keys['s'] || keys['arrowdown']) state.speed = Math.max(state.speed - 0.1, -0.8);
      else state.speed *= 0.97;
      
      // Move
      let newX = state.x + Math.sin(state.angle) * state.speed;
      let newZ = state.z + Math.cos(state.angle) * state.speed;
      
      // Building collisions - bouncy!
      const carRadius = 2.5;
      let bounced = false;
      buildings.filter(b => b.wLayer === 1).forEach(b => {
        if (bounced) return;
        const g = b.mesh.geometry as THREE.BoxGeometry;
        const bx = b.mesh.position.x, bz = b.mesh.position.z;
        const hw = g.parameters.width / 2 + carRadius;
        const hd = g.parameters.depth / 2 + carRadius;
        
        // Check if car would be inside building
        if (newX > bx - hw && newX < bx + hw && newZ > bz - hd && newZ < bz + hd) {
          // Bounce! Reflect velocity and add some chaos
          const dx = newX - bx;
          const dz = newZ - bz;
          
          // Determine which side hit
          const overlapX = hw - Math.abs(dx);
          const overlapZ = hd - Math.abs(dz);
          
          if (overlapX < overlapZ) {
            // Hit from side - bounce in X
            state.angle = -state.angle + (Math.random() - 0.5) * 0.5;
            newX = dx > 0 ? bx + hw + 0.1 : bx - hw - 0.1;
          } else {
            // Hit from front/back - bounce in Z  
            state.angle = Math.PI - state.angle + (Math.random() - 0.5) * 0.5;
            newZ = dz > 0 ? bz + hd + 0.1 : bz - hd - 0.1;
          }
          
          // Bounce speed (like GTA VC ramps)
          state.speed *= -0.6;
          bounced = true;
        }
      });
      
      state.x = newX;
      state.z = newZ;
      
      // 4D shift
      if (keys['q']) state.w = Math.max(-W_SPACING, state.w - 0.8);
      if (keys['e']) state.w = Math.min(W_SPACING, state.w + 0.8);
      if (!keys['q'] && !keys['e']) state.w *= 0.95; // Return to center
      
      // Update car
      carGroup.position.set(state.x, 0, state.z);
      carGroup.rotation.y = -state.angle;
      
      // Update building visibility based on W
      buildings.forEach(b => {
        const wDist = Math.abs((b.wLayer - 1) * W_SPACING - state.w);
        
        if (b.wLayer === 1) {
          // Main layer fades as you leave
          (b.mesh.material as THREE.MeshLambertMaterial).opacity = Math.max(0.3, 1 - Math.abs(state.w) * 0.02);
        } else {
          // Ghost layers appear as you approach
          const targetW = (b.wLayer - 1) * W_SPACING;
          const proximity = 1 - Math.min(1, Math.abs(state.w - targetW) / W_SPACING);
          (b.mesh.material as THREE.MeshBasicMaterial).opacity = proximity * 0.5;
          b.mesh.visible = proximity > 0.05;
        }
      });
      
      // Camera
      const camAngle = state.angle + state.camYaw;
      const camH = state.camDist * Math.sin(state.camPitch);
      const camD = state.camDist * Math.cos(state.camPitch);
      camera.position.set(
        state.x - Math.sin(camAngle) * camD,
        camH + 2,
        state.z - Math.cos(camAngle) * camD
      );
      camera.lookAt(state.x, 1.2, state.z);
      
      // HUD
      const speedKmh = Math.abs(Math.round(state.speed * 60));
      const wLayer = state.w < -15 ? 'Past' : state.w > 15 ? 'Future' : 'Present';
      const wColor = state.w < -15 ? '#f64' : state.w > 15 ? '#4f8' : '#fff';
      hud.innerHTML = `
        <div style="font-size:16px;font-weight:bold;color:#4a4">🏠 GROVE STREET</div>
        <div style="margin-top:10px;font-size:20px">${speedKmh} <span style="font-size:12px">km/h</span></div>
        <div style="color:${wColor};margin-top:5px">Dimension: ${wLayer}</div>
        <hr style="border-color:#333;margin:10px 0">
        <div style="font-size:11px;color:#aaa">W/S = Gas/Brake</div>
        <div style="font-size:11px;color:#aaa">A/D = Steer</div>
        <div style="font-size:11px;color:#aaa">Q/E = Shift Dimension</div>
        <div style="font-size:11px;color:#aaa">Mouse = Camera</div>
      `;
      
      drawMinimap();
      renderer.render(scene, camera);
    }
    
    animate();
    
    return () => {
      containerRef.current && (containerRef.current.innerHTML = '');
      hud.remove();
      mapDiv.remove();
    };
  }, []);
  
  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
}
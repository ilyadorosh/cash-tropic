"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Stats {
  speed: number;
  wPos: number;
  airTime: number;
  money: number;
  wAngle: number; // 4D steering angle
  playerX: number;
  playerZ: number;
  carAngle: number;
}

export default function TensorGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<Stats>({ speed: 0, wPos: 0, airTime: 0, money: 0, wAngle: 0, playerX: 0, playerZ: 0, carAngle: 0 });
  const [locked, setLocked] = useState(false);
  const [rotMode, setRotMode] = useState<'3D' | '4D'>('3D');

  useEffect(() => {
    if (!mountRef.current) return;

    let isLocked = false;
    let rotation4DMode = false; // Hold CTRL to rotate in 4D

    // Scene setup - OPTIMIZED
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000818);
    scene.fog = new THREE.FogExp2(0x000818, 0.003); // Exponential fog for better performance

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disable AA for performance
      powerPreference: 'high-performance' // Request discrete GPU
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap pixel ratio
    mountRef.current.appendChild(renderer.domElement);

    // Pointer lock
    const handleClick = () => {
      if (!isLocked) {
        renderer.domElement.requestPointerLock();
      }
    };
    
    const handlePointerLockChange = () => {
      isLocked = document.pointerLockElement === renderer.domElement;
      setLocked(isLocked);
    };

    renderer.domElement.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Simple lighting
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x334466, 0.6));

    // ========== 3D MINIMAP SETUP ==========
    let miniMapRenderer: THREE.WebGLRenderer | null = null;
    let miniMapScene: THREE.Scene | null = null;
    let miniMapCamera: THREE.PerspectiveCamera | null = null;
    const miniMapPlatforms: THREE.Mesh[] = [];
    let miniMapPlayer: THREE.Mesh | null = null;
    let miniMapArrow: THREE.Mesh | null = null;
    
    // Initialize 3D minimap when canvas is ready
    const initMiniMap = () => {
      if (!miniMapRef.current) return;
      
      miniMapScene = new THREE.Scene();
      miniMapScene.background = new THREE.Color(0x000818);
      
      // Orthographic-ish view from above, tilted
      miniMapCamera = new THREE.PerspectiveCamera(50, 1, 1, 500);
      miniMapCamera.position.set(0, 120, 80);
      miniMapCamera.lookAt(0, 0, 0);
      
      miniMapRenderer = new THREE.WebGLRenderer({ 
        canvas: miniMapRef.current,
        antialias: false,
        alpha: true
      });
      miniMapRenderer.setSize(180, 180);
      miniMapRenderer.setPixelRatio(1);
      
      // Add lighting to minimap
      const miniSun = new THREE.DirectionalLight(0xffffff, 1);
      miniSun.position.set(10, 50, 10);
      miniMapScene.add(miniSun);
      miniMapScene.add(new THREE.AmbientLight(0x334466, 0.8));
      
      // Grid floor
      const gridGeo = new THREE.PlaneGeometry(200, 200, 20, 20);
      const gridMat = new THREE.MeshBasicMaterial({ 
        color: 0x002233, 
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const grid = new THREE.Mesh(gridGeo, gridMat);
      grid.rotation.x = -Math.PI / 2;
      miniMapScene.add(grid);
      
      // Axis indicators
      const axisLen = 90;
      // X axis (red)
      const xAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-axisLen, 0.5, 0), new THREE.Vector3(axisLen, 0.5, 0)]),
        new THREE.LineBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.5 })
      );
      miniMapScene.add(xAxis);
      // Z axis (green)  
      const zAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.5, -axisLen), new THREE.Vector3(0, 0.5, axisLen)]),
        new THREE.LineBasicMaterial({ color: 0x33ff33, transparent: true, opacity: 0.5 })
      );
      miniMapScene.add(zAxis);
      // W axis visualized as vertical (cyan)
      const wAxis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -30, 0), new THREE.Vector3(0, 60, 0)]),
        new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 })
      );
      miniMapScene.add(wAxis);
      
      // Player marker (red arrow-shaped)
      const playerGeo = new THREE.ConeGeometry(4, 8, 4);
      playerGeo.rotateX(Math.PI / 2);
      miniMapPlayer = new THREE.Mesh(
        playerGeo,
        new THREE.MeshLambertMaterial({ color: 0xff2200, emissive: 0x440000 })
      );
      miniMapScene.add(miniMapPlayer);
      
      // Direction arrow
      const arrowGeo = new THREE.ConeGeometry(2, 6, 4);
      arrowGeo.rotateX(-Math.PI / 2);
      arrowGeo.translate(0, 0, 6);
      miniMapArrow = new THREE.Mesh(
        arrowGeo,
        new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0x444400 })
      );
      miniMapScene.add(miniMapArrow);
    };
    
    // We'll call this later once platforms are created
    const updateMiniMapPlatforms = () => {
      if (!miniMapScene) return;
      
      // Clear old platforms
      miniMapPlatforms.forEach(m => miniMapScene!.remove(m));
      miniMapPlatforms.length = 0;
      
      // Add platform representations
      platforms.forEach(p => {
        const scale = 0.3; // Scale down for minimap
        const geo = new THREE.BoxGeometry(p.width * scale, Math.max(p.height * scale, 2), p.depth * scale);
        
        // Color based on W layer
        let color = 0x00ff66; // W=0 green
        if (p.w > 3) color = 0x0066ff; // W+ blue
        else if (p.w < -3) color = 0xff0066; // W- pink
        
        const mat = new THREE.MeshLambertMaterial({ 
          color, 
          transparent: true,
          opacity: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        // Position: X and Z as normal, Y = W layer (so we can see 4D structure!)
        mesh.position.set(p.x * scale, p.w * 2, -p.z * scale);
        miniMapScene!.add(mesh);
        miniMapPlatforms.push(mesh);
      });
      
      // Add hyperpyramids to minimap
      hyperPyramids.forEach(hp => {
        const scale = 0.3;
        const geo = new THREE.TetrahedronGeometry(4 * scale);
        const mat = new THREE.MeshLambertMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(hp.x * scale, hp.w * 2 + 5, -hp.z * scale);
        miniMapScene!.add(mesh);
        miniMapPlatforms.push(mesh);
      });
      
      // Add hypercones to minimap
      hyperCones.forEach(hc => {
        const scale = 0.3;
        const geo = new THREE.ConeGeometry(5 * scale, 3 * scale, 6);
        const mat = new THREE.MeshLambertMaterial({ color: 0x00ff88, emissive: 0x004422 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(hc.x * scale, hc.w * 2 + 3, -hc.z * scale);
        miniMapScene!.add(mesh);
        miniMapPlatforms.push(mesh);
      });
    };

    // ========== 4D CORE ==========
    let rotXW = 0;  // 4D rotation angles
    let rotZW = 0;
    
    // Project 4D to 3D
    function project4D(x: number, y: number, z: number, w: number): THREE.Vector3 {
      const cosXW = Math.cos(rotXW);
      const sinXW = Math.sin(rotXW);
      const x1 = x * cosXW - w * sinXW;
      const w1 = x * sinXW + w * cosXW;
      
      const cosZW = Math.cos(rotZW);
      const sinZW = Math.sin(rotZW);
      const z1 = z * cosZW - w1 * sinZW;
      const w2 = z * sinZW + w1 * cosZW;
      
      const wDist = 5;
      const scale = wDist / (wDist + w2 * 0.05);
      
      return new THREE.Vector3(x1 * scale, y * scale, z1 * scale);
    }

    // ========== SIMPLE PLATFORMS (LOW POLY) ==========
    interface Platform4D {
      x: number; y: number; z: number; w: number;
      width: number; height: number; depth: number;
      color: number;
      mesh: THREE.Mesh;
      isRamp?: boolean;
      rampDir?: number; // 0=+X, 1=-X, 2=+Z, 3=-Z
    }
    const platforms: Platform4D[] = [];
    
    // Create simple box platform
    function createPlatform(x: number, y: number, z: number, w: number, 
                           width: number, height: number, depth: number, 
                           color: number, isRamp = false, rampDir = 0): Platform4D {
      let geo: THREE.BufferGeometry;
      
      if (isRamp) {
        // Simple ramp = slanted box (use 8 vertices only)
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(depth, 0);
        shape.lineTo(depth, height);
        shape.lineTo(0, 0);
        geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
        geo.rotateY(Math.PI / 2);
        geo.translate(-width/2, 0, 0);
      } else {
        geo = new THREE.BoxGeometry(width, height, depth);
        geo.translate(0, height/2, 0);
      }
      
      const mat = new THREE.MeshLambertMaterial({ 
        color, 
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      
      const p: Platform4D = { x, y, z, w, width, height, depth, color, mesh, isRamp, rampDir };
      platforms.push(p);
      return p;
    }
    
    // ========== BUILD THE 4D PLATFORMER WORLD ==========
    
    // Ground plane (simple, no subdivisions!)
    const groundGeo = new THREE.PlaneGeometry(400, 400, 1, 1);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x001122 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    
    // Grid lines (minimal)
    const gridHelper = new THREE.GridHelper(400, 20, 0x00ffff, 0x003344);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);
    
    // ========== 4D ROADS ==========
    // Roads connect platforms - they exist in 4D space too!
    interface Road4D {
      from: [number, number, number, number]; // x, y, z, w
      to: [number, number, number, number];
      mesh: THREE.Mesh;
      line: THREE.Line;
    }
    const roads4D: Road4D[] = [];
    
    function createRoad(from: [number, number, number, number], to: [number, number, number, number], color = 0x444444) {
      // Calculate direction and length
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const dz = to[2] - from[2];
      const length3D = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // Road surface
      const roadGeo = new THREE.PlaneGeometry(6, length3D);
      const roadMat = new THREE.MeshLambertMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      
      // Position at midpoint
      roadMesh.position.set(
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2 + 0.1,
        (from[2] + to[2]) / 2
      );
      
      // Rotate to face direction
      roadMesh.rotation.x = -Math.PI / 2;
      const angle = Math.atan2(dx, dz);
      roadMesh.rotation.z = -angle;
      
      scene.add(roadMesh);
      
      // Center line (dashed effect with segments)
      const lineGeo = new THREE.BufferGeometry();
      const linePoints: number[] = [];
      const segments = Math.floor(length3D / 5);
      for (let i = 0; i < segments; i += 2) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        linePoints.push(
          from[0] + dx * t1, from[1] + 0.2, from[2] + dz * t1,
          from[0] + dx * t2, from[1] + 0.2, from[2] + dz * t2
        );
      }
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
      const line = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(line);
      
      const road: Road4D = { from, to, mesh: roadMesh, line };
      roads4D.push(road);
      return road;
    }
    
    // Main roads in W=0 layer
    createRoad([0, 0, 15, 0], [0, 0, 40, 0], 0x333333);
    createRoad([0, 0, 40, 0], [0, 3, 70, 0], 0x333333);
    createRoad([0, 3, 70, 0], [0, 6, 100, 0], 0x333333);
    createRoad([0, 6, 100, 0], [0, 10, 130, 0], 0x333333);
    createRoad([0, 10, 130, 0], [0, 0, 160, 0], 0x333333);
    
    // Road to back jump
    createRoad([0, 0, -15, 0], [0, 0, -100, 0], 0x333333);
    
    // Cross roads connecting W layers (these fade based on W!)
    createRoad([15, 0, 0, 0], [50, 0, 0, 10], 0x0044aa);  // W=0 to W=10
    createRoad([-15, 0, 0, 0], [-50, 0, 0, -10], 0xaa0044); // W=0 to W=-10
    
    // Roads in W=10 layer
    createRoad([50, 0, 0, 10], [80, 0, 0, 10], 0x0066ff);
    createRoad([80, 0, 0, 10], [110, 3, 0, 10], 0x0066ff);
    createRoad([110, 3, 0, 10], [140, 7, 0, 10], 0x0066ff);
    createRoad([50, 0, 0, 10], [50, 10, 50, 10], 0x0044dd);
    
    // Roads in W=-10 layer
    createRoad([-50, 0, 0, -10], [-80, 0, 0, -10], 0xff0066);
    createRoad([-80, 0, 0, -10], [-110, 5, 0, -10], 0xff0066);
    createRoad([-110, 5, 0, -10], [-140, 10, 0, -10], 0xff0066);
    createRoad([-80, 0, 0, -10], [-80, 0, 80, -10], 0xaa0044);

    // === STARTING AREA (W=0) ===
    createPlatform(0, 0, 0, 0, 30, 1, 30, 0x00aa44); // Start platform
    
    // Jump path forward
    createPlatform(0, 0, 40, 0, 15, 1, 15, 0x00cc66);
    createPlatform(0, 3, 70, 0, 12, 1, 12, 0x00dd77);
    createPlatform(0, 6, 100, 0, 10, 1, 10, 0x00ee88);
    createPlatform(0, 10, 130, 0, 12, 1, 12, 0x00ff99);
    
    // Ramp to jump off
    createPlatform(0, 0, 160, 0, 15, 8, 25, 0xffaa00, true, 2);
    
    // Landing platform high up
    createPlatform(0, 15, 200, 0, 20, 2, 20, 0xff8800);
    
    // === W=+10 LAYER (shift right with Q) ===
    createPlatform(50, 0, 0, 10, 20, 1, 20, 0x0066ff);
    createPlatform(80, 0, 0, 10, 15, 1, 15, 0x0088ff);
    createPlatform(110, 3, 0, 10, 12, 1, 12, 0x00aaff);
    createPlatform(140, 7, 0, 10, 10, 1, 10, 0x00ccff);
    
    // Floating platforms in W=10 (need to shift to W=10 to see them solid)
    createPlatform(50, 10, 50, 10, 12, 1, 12, 0x0044dd);
    createPlatform(80, 15, 50, 10, 10, 1, 10, 0x0066ee);
    createPlatform(50, 20, 80, 10, 15, 1, 15, 0x0088ff);
    
    // === W=-10 LAYER (shift left with E) ===
    createPlatform(-50, 0, 0, -10, 20, 1, 20, 0xff0066);
    createPlatform(-80, 0, 0, -10, 15, 1, 15, 0xff0088);
    createPlatform(-110, 5, 0, -10, 12, 1, 12, 0xff00aa);
    createPlatform(-140, 10, 0, -10, 10, 1, 10, 0xff00cc);
    
    // Tall tower in W=-10
    createPlatform(-80, 0, 80, -10, 10, 30, 10, 0xaa0044);
    createPlatform(-80, 30, 80, -10, 15, 2, 15, 0xff0066);
    
    // === SPIRAL ACROSS W (goes from W=-20 to W=+20) ===
    for (let i = 0; i < 15; i++) {
      const angle = i * 0.5;
      const radius = 60;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius - 100;
      const py = i * 4;
      const pw = (i - 7) * 3; // -21 to +21
      
      const hue = i / 15;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
      createPlatform(px, py, pz, pw, 10, 2, 10, color.getHex());
    }
    
    // === CHALLENGE RAMPS (different W levels) ===
    createPlatform(100, 0, -50, 5, 20, 12, 30, 0xffff00, true, 3);
    createPlatform(-100, 0, -50, -5, 20, 12, 30, 0xff00ff, true, 3);
    
    // Big jump at the back
    createPlatform(0, 0, -100, 0, 30, 20, 40, 0xff4400, true, 3);
    createPlatform(0, 25, -180, 0, 25, 3, 25, 0xff6600);
    
    // === COLLECTIBLE RINGS (simple toruses) ===
    interface Ring4D {
      x: number; y: number; z: number; w: number;
      mesh: THREE.Mesh;
      collected: boolean;
    }
    const rings: Ring4D[] = [];
    
    const ringGeo = new THREE.TorusGeometry(2, 0.3, 6, 12); // Low poly ring
    const ringPositions = [
      [0, 8, 70, 0], [0, 14, 100, 0], [0, 20, 200, 0],
      [50, 5, 0, 10], [80, 8, 0, 10], [110, 12, 0, 10],
      [-50, 5, 0, -10], [-80, 8, 0, -10], [-80, 35, 80, -10],
      [0, 30, -180, 0], [100, 15, -50, 5], [-100, 15, -50, -5],
    ];
    
    ringPositions.forEach((pos, i) => {
      const hue = i / ringPositions.length;
      const mat = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(hue, 1, 0.5),
        emissive: new THREE.Color().setHSL(hue, 1, 0.3)
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);
      rings.push({ x: pos[0], y: pos[1], z: pos[2], w: pos[3], mesh, collected: false });
    });

    // ========== HYPERPYRAMIDS (4D pyramids - direction markers) ==========
    // These point in the cardinal directions including W!
    interface HyperPyramid4D {
      x: number; y: number; z: number; w: number;
      dirX: number; dirZ: number; dirW: number;  // Direction it points
      mesh: THREE.Mesh;
      glow: THREE.Mesh;
    }
    const hyperPyramids: HyperPyramid4D[] = [];
    
    function createHyperPyramid(x: number, y: number, z: number, w: number, 
                                dirX: number, dirZ: number, dirW: number, color: number) {
      // Main pyramid pointing in direction
      const pyrGeo = new THREE.ConeGeometry(3, 8, 4);
      const pyrMat = new THREE.MeshLambertMaterial({ 
        color, 
        transparent: true,
        opacity: 0.9
      });
      const pyrMesh = new THREE.Mesh(pyrGeo, pyrMat);
      
      // Rotate to point in direction
      const angleXZ = Math.atan2(dirX, dirZ);
      pyrMesh.rotation.z = -Math.PI / 2;  // Lay flat
      pyrMesh.rotation.y = -angleXZ;      // Point direction
      
      // If pointing into W, tilt up/down
      if (Math.abs(dirW) > 0.5) {
        pyrMesh.rotation.x = dirW > 0 ? 0.3 : -0.3;
      }
      
      scene.add(pyrMesh);
      
      // Glowing aura
      const glowGeo = new THREE.ConeGeometry(4, 10, 4);
      const glowMat = new THREE.MeshBasicMaterial({ 
        color, 
        transparent: true,
        opacity: 0.2,
        wireframe: true
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.rotation.copy(pyrMesh.rotation);
      scene.add(glowMesh);
      
      const hp: HyperPyramid4D = { x, y, z, w, dirX, dirZ, dirW, mesh: pyrMesh, glow: glowMesh };
      hyperPyramids.push(hp);
      return hp;
    }
    
    // Direction markers at key locations
    createHyperPyramid(0, 3, 20, 0, 0, 1, 0, 0x00ff00);   // Points forward (+Z)
    createHyperPyramid(25, 3, 0, 5, 1, 0, 1, 0x0088ff);   // Points to W=+10 area
    createHyperPyramid(-25, 3, 0, -5, -1, 0, -1, 0xff0088); // Points to W=-10 area
    createHyperPyramid(0, 3, -50, 0, 0, -1, 0, 0xff4400);  // Points to back jump
    
    // ========== HYPERCONES (4D launch pads!) ==========
    // These give you momentum boost when you drive over them
    interface HyperCone4D {
      x: number; y: number; z: number; w: number;
      boostX: number; boostY: number; boostZ: number; boostW: number;
      mesh: THREE.Mesh;
      ring: THREE.Mesh;
      particles: THREE.Points;
      cooldown: number;
    }
    const hyperCones: HyperCone4D[] = [];
    
    function createHyperCone(x: number, y: number, z: number, w: number,
                             boostX: number, boostY: number, boostZ: number, boostW: number,
                             color: number) {
      // Cone base
      const coneGeo = new THREE.ConeGeometry(5, 3, 8);
      const coneMat = new THREE.MeshLambertMaterial({ 
        color, 
        transparent: true,
        opacity: 0.8,
        emissive: color,
        emissiveIntensity: 0.3
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.rotation.x = Math.PI;  // Point down (base up)
      scene.add(coneMesh);
      
      // Pulsing ring around it
      const ringGeo = new THREE.TorusGeometry(6, 0.5, 6, 16);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true,
        opacity: 0.5
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      scene.add(ringMesh);
      
      // Particle effect
      const particleCount = 20;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * 4;
        positions[i * 3 + 1] = Math.random() * 5;
        positions[i * 3 + 2] = Math.sin(angle) * 4;
      }
      particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({ 
        color, 
        size: 0.8,
        transparent: true,
        opacity: 0.8
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);
      
      const hc: HyperCone4D = { 
        x, y, z, w, 
        boostX, boostY, boostZ, boostW,
        mesh: coneMesh, ring: ringMesh, particles,
        cooldown: 0
      };
      hyperCones.push(hc);
      return hc;
    }
    
    // Jump pads at various locations
    createHyperCone(0, 0.5, 50, 0, 0, 1.2, 0.5, 0, 0x00ffff);      // Forward jump
    createHyperCone(0, 0.5, -60, 0, 0, 1.5, -0.8, 0, 0xff8800);    // Back mega-jump
    createHyperCone(35, 0.5, 0, 5, 0.3, 0.8, 0, 0.5, 0x00ff88);    // Jump into W+
    createHyperCone(-35, 0.5, 0, -5, -0.3, 0.8, 0, -0.5, 0xff00ff);// Jump into W-
    createHyperCone(60, 1, 0, 10, 0, 1.0, 0.3, 0, 0x0066ff);       // W=10 launcher
    createHyperCone(-60, 1, 0, -10, 0, 1.0, -0.3, 0, 0xff0066);    // W=-10 launcher
    createHyperCone(0, 16, 200, 0, 0, 0.5, -0.5, 0, 0xffff00);     // High platform launcher

    // Initialize 3D minimap and populate with platforms
    initMiniMap();
    setTimeout(() => updateMiniMapPlatforms(), 100);  // Slight delay to ensure all objects created

    // ========== CAR (PLAYER) ==========
    const carGroup = new THREE.Group();
    
    // Simple car body
    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 5),
      new THREE.MeshLambertMaterial({ color: 0xff2200 })
    );
    carBody.position.y = 1;
    carGroup.add(carBody);
    
    // Cab
    const carCab = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1, 2.5),
      new THREE.MeshLambertMaterial({ color: 0xcc1100 })
    );
    carCab.position.y = 2;
    carCab.position.z = -0.5;
    carGroup.add(carCab);
    
    // 3D Wheels (standard XZ wheels)
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const wheels3D: THREE.Mesh[] = [];
    [[-1.5, 0.6, 1.5], [1.5, 0.6, 1.5], [-1.5, 0.6, -1.5], [1.5, 0.6, -1.5]].forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      carGroup.add(wheel);
      wheels3D.push(wheel);
    });
    
    // 4D HYPERSPHERE WHEELS (S³ represented as nested spheres)
    // In 4D, a wheel is a 3-sphere. We visualize this as concentric spheres
    // that pulse/shift based on the 4D steering angle
    const hyperWheelGroup = new THREE.Group();
    
    // Outer hypersphere shell (shows 4D orientation)
    const hyperOuter = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 12, 8),
      new THREE.MeshBasicMaterial({ 
        color: 0xff00ff, 
        wireframe: true,
        transparent: true,
        opacity: 0.4
      })
    );
    hyperWheelGroup.add(hyperOuter);
    
    // Middle layer
    const hyperMid = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 10, 6),
      new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        wireframe: true,
        transparent: true,
        opacity: 0.5
      })
    );
    hyperWheelGroup.add(hyperMid);
    
    // Core (solid)
    const hyperCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0x444400 })
    );
    hyperWheelGroup.add(hyperCore);
    
    // Position at front of car
    hyperWheelGroup.position.set(0, 0.8, 2.5);
    carGroup.add(hyperWheelGroup);
    
    // 4D shell indicator (pulses with W movement)
    const shellGeo = new THREE.BoxGeometry(4, 2.5, 6);
    const shellMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const carShell = new THREE.Mesh(shellGeo, shellMat);
    carShell.position.y = 1.25;
    carGroup.add(carShell);
    
    // W-direction indicator arrow (shows which way we're steering in 4D)
    const wArrowGeo = new THREE.ConeGeometry(0.3, 1.5, 6);
    const wArrowMat = new THREE.MeshLambertMaterial({ color: 0xff00ff, emissive: 0x330033 });
    const wArrow = new THREE.Mesh(wArrowGeo, wArrowMat);
    wArrow.position.set(0, 2.5, 0);
    wArrow.rotation.z = Math.PI / 2; // Point sideways initially
    carGroup.add(wArrow);
    
    scene.add(carGroup);

    // ========== GAME STATE ==========
    const keys: Record<string, boolean> = {};
    
    // Player position in 4D
    let playerX = 0;
    let playerY = 2;
    let playerZ = 0;
    let playerW = 0;
    
    // Car physics - TRUE 4D DRIVING
    // The car exists in 4D and can steer into any combination of XZ and W
    let carAngleXZ = 0;  // Standard left/right steering (A/D)
    let carAngleW = 0;   // 4D steering - how much we're pointing into W (Q/E)
    let speed = 0;
    let verticalVelocity = 0;
    let isGrounded = true;
    let airTime = 0;
    let money = 0;
    
    // Physics constants
    const maxSpeed = 1.5;
    const acceleration = 0.05;
    const braking = 0.07;
    const friction = 0.012;
    const turnSpeedXZ = 0.05;  // A/D turn rate
    const turnSpeedW = 0.04;   // Q/E 4D turn rate
    const maxWAngle = Math.PI / 3;  // Max 60° into W dimension
    const gravity = 0.025;
    const jumpForce = 0.6;
    
    // Camera
    let camYaw = 0;
    let camPitch = 0;
    const mouseSens = 0.002;

    // Mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (!isLocked) return;
      
      if (rotation4DMode) {
        // CTRL held: rotate in 4D
        rotXW -= e.movementX * mouseSens * 2;
        rotZW += e.movementY * mouseSens * 2;  // Fixed: was inverted
        setRotMode('4D');
      } else {
        // Normal: rotate camera in 3D
        camYaw -= e.movementX * mouseSens;
        camPitch += e.movementY * mouseSens;  // Fixed: was inverted
        camPitch = Math.max(-0.8, Math.min(0.8, camPitch));
        setRotMode('3D');
      }
    };
    document.addEventListener('mousemove', handleMouseMove);

    // Key controls
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === 'Control') rotation4DMode = true;
      if (e.key === 'Escape') document.exitPointerLock();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
      if (e.key === 'Control') rotation4DMode = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // ========== COLLISION DETECTION ==========
    function checkPlatformCollision(px: number, py: number, pz: number, pw: number): { 
      onGround: boolean; 
      groundY: number;
      onRamp: boolean;
      rampAngle: number;
    } {
      let onGround = false;
      let groundY = 0;
      let onRamp = false;
      let rampAngle = 0;
      
      // Check base ground
      if (py <= 0.5) {
        onGround = true;
        groundY = 0;
      }
      
      // Check platforms
      for (const plat of platforms) {
        // 4D distance check - platform fades if W is far
        const wDist = Math.abs(pw - plat.w);
        if (wDist > 8) continue; // Too far in W, can't collide
        
        // Collision bounds (slightly larger than platform)
        const halfW = plat.width / 2 + 1.5;
        const halfD = plat.depth / 2 + 1.5;
        
        const inX = px > plat.x - halfW && px < plat.x + halfW;
        const inZ = pz > plat.z - halfD && pz < plat.z + halfD;
        
        if (inX && inZ) {
          if (plat.isRamp) {
            // Calculate ramp height at player position
            let rampProgress = 0;
            if (plat.rampDir === 2 || plat.rampDir === 3) {
              // Z-direction ramp
              rampProgress = (pz - (plat.z - plat.depth/2)) / plat.depth;
              if (plat.rampDir === 3) rampProgress = 1 - rampProgress;
            } else {
              // X-direction ramp
              rampProgress = (px - (plat.x - plat.width/2)) / plat.width;
              if (plat.rampDir === 1) rampProgress = 1 - rampProgress;
            }
            rampProgress = Math.max(0, Math.min(1, rampProgress));
            const rampY = plat.y + rampProgress * plat.height;
            
            if (py <= rampY + 1 && py > rampY - 2) {
              onGround = true;
              groundY = Math.max(groundY, rampY);
              onRamp = true;
              rampAngle = Math.atan2(plat.height, plat.depth);
            }
          } else {
            // Flat platform
            const platTop = plat.y + plat.height;
            if (py <= platTop + 1 && py > platTop - 2) {
              onGround = true;
              groundY = Math.max(groundY, platTop);
            }
          }
        }
      }
      
      return { onGround, groundY, onRamp, rampAngle };
    }

    // ========== ANIMATION LOOP ==========
    function animate() {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      if (isLocked) {
        // === TRUE 4D CAR DRIVING ===
        // W/S = forward/backward (accelerate in whatever 4D direction we're facing)
        if (keys['w']) {
          speed = Math.min(speed + acceleration, maxSpeed);
        } else if (keys['s']) {
          speed = Math.max(speed - braking, -maxSpeed * 0.4);
        } else {
          // Friction
          if (speed > 0) speed = Math.max(0, speed - friction);
          if (speed < 0) speed = Math.min(0, speed + friction);
        }
        
        // A/D = standard XZ steering (turn left/right in 3D)
        if (Math.abs(speed) > 0.05) {
          const turnMult = speed > 0 ? 1 : -1;
          if (keys['a']) carAngleXZ += turnSpeedXZ * turnMult;
          if (keys['d']) carAngleXZ -= turnSpeedXZ * turnMult;
        }
        
        // Q/E = 4D WHEEL STEERING (turn the hypersphere wheels into W dimension!)
        // This changes how much of your forward motion goes into W vs XZ
        if (keys['q']) {
          carAngleW = Math.min(carAngleW + turnSpeedW, maxWAngle);
        } else if (keys['e']) {
          carAngleW = Math.max(carAngleW - turnSpeedW, -maxWAngle);
        } else {
          // Slowly return to center (like real steering)
          if (carAngleW > 0.01) carAngleW -= turnSpeedW * 0.3;
          else if (carAngleW < -0.01) carAngleW += turnSpeedW * 0.3;
          else carAngleW = 0;
        }
        
        // SPACE = jump (when grounded)
        if (keys[' '] && isGrounded) {
          verticalVelocity = jumpForce;
          isGrounded = false;
        }
        
        // === 4D PHYSICS ===
        // The car's forward direction is split between XZ plane and W axis
        // based on carAngleW (the 4D steering angle)
        
        // When carAngleW = 0: all motion in XZ (normal driving)
        // When carAngleW = ±60°: significant motion into W dimension
        const xzComponent = Math.cos(carAngleW);  // How much goes into XZ
        const wComponent = Math.sin(carAngleW);   // How much goes into W
        
        // XZ movement (traditional driving, scaled by xzComponent)
        const moveX = Math.sin(carAngleXZ) * speed * xzComponent;
        const moveZ = Math.cos(carAngleXZ) * speed * xzComponent;
        
        // W movement (4D driving!)
        const moveW = speed * wComponent;
        
        playerX += moveX;
        playerZ += moveZ;
        playerW += moveW;  // Drive into 4th dimension!
        
        // Gravity
        verticalVelocity -= gravity;
        playerY += verticalVelocity;
        
        // Collision check
        const collision = checkPlatformCollision(playerX, playerY, playerZ, playerW);
        
        if (collision.onGround && playerY <= collision.groundY + 1.5) {
          playerY = collision.groundY + 0.5;
          
          if (!isGrounded && airTime > 15) {
            // Landing bonus!
            money += Math.floor(airTime);
          }
          
          verticalVelocity = 0;
          isGrounded = true;
          airTime = 0;
          
          // Ramp boost
          if (collision.onRamp && speed > 0.3) {
            verticalVelocity += speed * 0.3;
            isGrounded = false;
          }
        } else {
          isGrounded = false;
          airTime++;
        }
        
        // Fall reset
        if (playerY < -50) {
          playerX = 0;
          playerY = 5;
          playerZ = 0;
          playerW = 0;
          speed = 0;
          verticalVelocity = 0;
        }
        
        // Update car position
        carGroup.position.set(playerX, playerY, playerZ);
        carGroup.rotation.y = carAngleXZ;
        
        // Car tilt based on speed/air
        carGroup.rotation.x = isGrounded ? 0 : -verticalVelocity * 0.3;
        carGroup.rotation.z = isGrounded ? -speed * 0.1 : 0;
        
        // === 4D VISUAL FEEDBACK ===
        
        // Hypersphere wheel animation - rotates based on 4D steering
        hyperOuter.rotation.x = time * 2;
        hyperOuter.rotation.y = carAngleW * 2;  // Tilts with 4D steering
        hyperMid.rotation.y = time * 3;
        hyperMid.rotation.z = carAngleW * 3;
        hyperCore.rotation.x = time * 5;
        
        // Scale hypersphere based on W movement ("inflating" in 4D)
        const wActivity = Math.abs(moveW) * 3 + 0.8;
        hyperOuter.scale.set(wActivity, wActivity, wActivity);
        
        // W arrow points in direction of 4D steering
        wArrow.rotation.z = Math.PI / 2 - carAngleW;  // Tilts with steering
        wArrow.material.color.setHSL(0.8 + carAngleW * 0.2, 1, 0.5);
        
        // Shell pulses with W velocity
        const wPulse = Math.abs(moveW) * 2 + 0.3;
        carShell.scale.set(1 + wPulse * 0.3, 1 + wPulse * 0.3, 1 + wPulse * 0.3);
        carShell.material.color.setHSL(0.5 + carAngleW * 0.3, 1, 0.5);
        
        // Regular 3D wheels spin with speed
        wheels3D.forEach(wheel => {
          wheel.rotation.x += speed * 0.3;
        });
      }
      
      // === UPDATE 4D OBJECTS ===
      // Roads: opacity and position based on W
      roads4D.forEach(road => {
        const roadW = (road.from[3] + road.to[3]) / 2;
        const wDist = Math.abs(playerW - roadW);
        const opacity = Math.max(0.1, 1 - wDist / 15);
        (road.mesh.material as THREE.MeshLambertMaterial).opacity = opacity * 0.8;
        (road.line.material as THREE.LineBasicMaterial).opacity = opacity;
        
        // 4D project road position
        const projFrom = project4D(road.from[0], road.from[1], road.from[2], road.from[3] - playerW);
        const projTo = project4D(road.to[0], road.to[1], road.to[2], road.to[3] - playerW);
        
        road.mesh.position.set(
          (projFrom.x + projTo.x) / 2,
          (projFrom.y + projTo.y) / 2 + 0.1,
          (projFrom.z + projTo.z) / 2
        );
      });
      
      // Platforms: opacity based on W distance
      platforms.forEach(plat => {
        const wDist = Math.abs(playerW - plat.w);
        const opacity = Math.max(0.15, 1 - wDist / 12);
        (plat.mesh.material as THREE.MeshLambertMaterial).opacity = opacity;
        
        // Also shift position slightly based on 4D rotation
        const proj = project4D(plat.x, 0, plat.z, plat.w - playerW);
        plat.mesh.position.set(proj.x, plat.y, proj.z);
      });
      
      // Rings: collect and animate
      rings.forEach(ring => {
        if (ring.collected) return;
        
        const wDist = Math.abs(playerW - ring.w);
        const opacity = Math.max(0.1, 1 - wDist / 10);
        (ring.mesh.material as THREE.MeshLambertMaterial).opacity = opacity;
        
        // Animate
        ring.mesh.rotation.z = time * 2;
        
        // 4D position
        const proj = project4D(ring.x, ring.y, ring.z, ring.w - playerW);
        ring.mesh.position.set(proj.x, proj.y + Math.sin(time * 3) * 0.5, proj.z);
        
        // Collect check
        const dx = playerX - ring.x;
        const dy = playerY - ring.y;
        const dz = playerZ - ring.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist < 4 && wDist < 5) {
          ring.collected = true;
          scene.remove(ring.mesh);
          money += 100;
        }
      });
      
      // Hyperpyramids: update position and pulse
      hyperPyramids.forEach(hp => {
        const wDist = Math.abs(playerW - hp.w);
        const opacity = Math.max(0.2, 1 - wDist / 12);
        (hp.mesh.material as THREE.MeshLambertMaterial).opacity = opacity;
        (hp.glow.material as THREE.MeshBasicMaterial).opacity = opacity * 0.3;
        
        const proj = project4D(hp.x, hp.y, hp.z, hp.w - playerW);
        hp.mesh.position.set(proj.x, proj.y + 3 + Math.sin(time * 2) * 0.5, proj.z);
        hp.glow.position.copy(hp.mesh.position);
        
        // Pulse glow
        const pulse = 1 + Math.sin(time * 3) * 0.2;
        hp.glow.scale.set(pulse, pulse, pulse);
        hp.glow.rotation.y = time;
      });
      
      // Hypercones: animate and check collision for boost
      hyperCones.forEach(hc => {
        const wDist = Math.abs(playerW - hc.w);
        const opacity = Math.max(0.15, 1 - wDist / 10);
        (hc.mesh.material as THREE.MeshLambertMaterial).opacity = opacity;
        (hc.ring.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6;
        (hc.particles.material as THREE.PointsMaterial).opacity = opacity;
        
        const proj = project4D(hc.x, hc.y, hc.z, hc.w - playerW);
        hc.mesh.position.set(proj.x, proj.y + 1.5, proj.z);
        hc.ring.position.set(proj.x, proj.y + 0.5, proj.z);
        hc.particles.position.set(proj.x, proj.y, proj.z);
        
        // Animate ring pulse
        const ringPulse = 1 + Math.sin(time * 4) * 0.3;
        hc.ring.scale.set(ringPulse, ringPulse, 1);
        hc.ring.rotation.z = time * 2;
        
        // Animate particles rising
        const positions = hc.particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += 0.1;
          if (positions[i + 1] > 8) positions[i + 1] = 0;
        }
        hc.particles.geometry.attributes.position.needsUpdate = true;
        
        // Cooldown
        if (hc.cooldown > 0) hc.cooldown--;
        
        // Check collision - BOOST!
        if (hc.cooldown === 0 && wDist < 6) {
          const dx = playerX - hc.x;
          const dz = playerZ - hc.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          
          if (dist < 7 && playerY < hc.y + 4) {
            // LAUNCH!
            verticalVelocity += hc.boostY;
            speed += Math.sqrt(hc.boostX * hc.boostX + hc.boostZ * hc.boostZ) * 0.5;
            playerW += hc.boostW * 3;  // 4D boost!
            
            hc.cooldown = 60;  // 1 second cooldown
            money += 25;  // Bonus for using launcher
            isGrounded = false;
          }
        }
        
        // Visual feedback when on cooldown
        if (hc.cooldown > 0) {
          (hc.mesh.material as THREE.MeshLambertMaterial).emissiveIntensity = 0.1;
        } else {
          (hc.mesh.material as THREE.MeshLambertMaterial).emissiveIntensity = 0.3 + Math.sin(time * 5) * 0.2;
        }
      });
      
      // === CAMERA ===
      // Third person camera that follows car
      const camDist = 15 + Math.abs(speed) * 8;
      const camHeight = 6 + (isGrounded ? 0 : 4);
      
      const camX = playerX - Math.sin(camYaw) * camDist;
      const camY = playerY + camHeight + camPitch * 10;
      const camZ = playerZ - Math.cos(camYaw) * camDist;
      
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
      camera.lookAt(playerX, playerY + 2, playerZ);
      
      // === UPDATE STATS ===
      setStats({
        speed: Math.round(Math.abs(speed) * 100),
        wPos: Math.round(playerW * 10) / 10,
        airTime: airTime,
        money: money,
        wAngle: Math.round(carAngleW * 180 / Math.PI),
        playerX: playerX,
        playerZ: playerZ,
        carAngle: carAngleXZ
      });
      
      renderer.render(scene, camera);
      
      // === 3D MINIMAP RENDER ===
      if (miniMapRenderer && miniMapScene && miniMapCamera && miniMapPlayer && miniMapArrow) {
        // Update player position on minimap (scale down)
        const scale = 0.3;
        miniMapPlayer.position.set(playerX * scale, playerW * 2, -playerZ * scale);
        miniMapPlayer.rotation.y = carAngleXZ;
        
        miniMapArrow.position.copy(miniMapPlayer.position);
        miniMapArrow.rotation.y = carAngleXZ;
        
        // Update minimap platform opacity based on W distance
        let platformIdx = 0;
        platforms.forEach(p => {
          if (miniMapPlatforms[platformIdx]) {
            const wDist = Math.abs(playerW - p.w);
            const opacity = Math.max(0.2, 1 - wDist / 15);
            (miniMapPlatforms[platformIdx].material as THREE.MeshLambertMaterial).opacity = opacity;
            // Highlight current W layer
            if (wDist < 3) {
              (miniMapPlatforms[platformIdx].material as THREE.MeshLambertMaterial).emissive.setHex(0x222222);
            } else {
              (miniMapPlatforms[platformIdx].material as THREE.MeshLambertMaterial).emissive.setHex(0x000000);
            }
          }
          platformIdx++;
        });
        
        // Camera follows player (top-down-ish, tilted)
        miniMapCamera.position.set(playerX * scale, 120 + playerW * 2, -playerZ * scale + 80);
        miniMapCamera.lookAt(playerX * scale, playerW * 2, -playerZ * scale);
        
        miniMapRenderer.render(miniMapScene, miniMapCamera);
      }
    }
    
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      if (miniMapRenderer) miniMapRenderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={mountRef} />
      
      {!locked && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#00ffff',
          fontFamily: 'monospace',
          fontSize: '20px',
          textAlign: 'center',
          textShadow: '0 0 20px #00ffff',
          background: 'rgba(0,0,0,0.95)',
          padding: '30px',
          borderRadius: '10px',
          border: '2px solid #00ffff',
          cursor: 'pointer',
          maxWidth: '480px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px', color: '#ff00ff' }}>4D DRIVER</div>
          <div style={{ fontSize: '14px', marginBottom: '20px', color: '#888' }}>True 4D Hypersphere Wheels</div>
          <div style={{ marginBottom: '20px' }}>Click to Play</div>
          
          <div style={{ fontSize: '14px', textAlign: 'left', lineHeight: '1.8' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold' }}>🚗 3D STEERING:</div>
            <div>W / S - Accelerate / Brake</div>
            <div>A / D - Turn Left / Right (in XZ plane)</div>
            <div>SPACE - Jump</div>
            
            <div style={{ color: '#ff00ff', fontWeight: 'bold', marginTop: '12px' }}>🌀 4D STEERING (Hypersphere Wheels):</div>
            <div>Q - Steer INTO W dimension (turn wheels +W)</div>
            <div>E - Steer OUT OF W dimension (turn wheels -W)</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
              Your 4D wheels (S³ hyperspheres) can point into W!<br/>
              When steering into W, you DRIVE through it!<br/>
              Not teleporting - actual 4D motion!
            </div>
            
            <div style={{ color: '#00ffff', fontWeight: 'bold', marginTop: '12px' }}>📐 CAMERA:</div>
            <div>Mouse - Look around</div>
            <div>CTRL + Mouse - Rotate 4D view angle</div>
            
            <div style={{ color: '#ffff00', fontWeight: 'bold', marginTop: '12px' }}>🎯 GOAL:</div>
            <div>Drive to platforms in different W layers!</div>
          </div>
        </div>
      )}

      {/* HUD */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: '#00ffff',
        fontFamily: 'monospace',
        fontSize: '16px',
        background: 'rgba(0,0,20,0.8)',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #00ffff'
      }}>
        <div>SPEED: {stats.speed}</div>
        <div style={{ color: '#ff00ff' }}>W POS: {stats.wPos}</div>
        <div style={{ 
          color: stats.wAngle !== 0 ? '#ffff00' : '#666',
          fontWeight: stats.wAngle !== 0 ? 'bold' : 'normal'
        }}>
          4D STEER: {stats.wAngle}°
        </div>
        <div style={{ color: '#00ff00' }}>${stats.money}</div>
        {stats.airTime > 10 && (
          <div style={{ color: '#ffff00' }}>🚀 AIR: {stats.airTime}</div>
        )}
      </div>
      
      {/* 4D 3D MINIMAP - True 3D GTA-style with W as height! */}
      <div style={{
        position: 'absolute',
        top: 140,
        left: 20,
        width: '184px',
        height: '210px',
        background: 'rgba(0,0,20,0.95)',
        borderRadius: '8px',
        border: '2px solid #00ffff',
        overflow: 'hidden',
        boxShadow: '0 0 20px rgba(0,255,255,0.3)'
      }}>
        {/* Map title */}
        <div style={{
          position: 'absolute',
          top: 2,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#00ffff',
          opacity: 0.9,
          zIndex: 10,
          textShadow: '0 0 5px #00ffff'
        }}>
          4D MAP • W={stats.wPos}
        </div>
        
        {/* 3D Canvas Minimap */}
        <canvas 
          ref={miniMapRef}
          width={180}
          height={180}
          style={{
            position: 'absolute',
            top: 14,
            left: 2,
            borderRadius: '4px'
          }}
        />
        
        {/* W-layer legend with gradient */}
        <div style={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          right: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'monospace',
          fontSize: '8px'
        }}>
          <span style={{ color: '#ff0066' }}>W-</span>
          <div style={{
            flex: 1,
            height: '4px',
            margin: '0 4px',
            background: 'linear-gradient(to right, #ff0066, #00ff66, #0066ff)',
            borderRadius: '2px'
          }} />
          <span style={{ color: '#0066ff' }}>W+</span>
        </div>
        
        {/* Axis legend */}
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: 8,
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#666'
        }}>
          <span style={{ color: '#ff3333' }}>X</span>
          <span style={{ color: '#33ff33' }}> Z</span>
          <span style={{ color: '#00ffff' }}> ↑W</span>
        </div>
      </div>
      
      {/* Rotation mode indicator */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        padding: '8px 16px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: rotMode === '4D' ? 'rgba(255,0,255,0.8)' : 'rgba(0,100,100,0.6)',
        color: 'white',
        border: `1px solid ${rotMode === '4D' ? '#ff00ff' : '#00ffff'}`
      }}>
        {rotMode === '4D' ? '4D ROTATION (CTRL)' : '3D CAMERA'}
      </div>
      
      {/* W dimension compass */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'rgba(0,0,20,0.8)',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #ff00ff',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ff00ff'
      }}>
        <div style={{ marginBottom: '6px' }}>W POSITION</div>
        <div style={{ 
          width: '100px', 
          height: '12px', 
          background: 'linear-gradient(to right, #ff0066, #ffff00, #00ff66)',
          borderRadius: '3px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-3px',
            left: `${Math.min(95, Math.max(5, (stats.wPos + 20) / 40 * 100))}%`,
            transform: 'translateX(-50%)',
            width: '4px',
            height: '18px',
            background: 'white',
            borderRadius: '2px'
          }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '10px' }}>
          <span>-W</span>
          <span>+W</span>
        </div>
        
        <div style={{ marginTop: '10px', marginBottom: '4px', color: '#ffff00' }}>4D WHEEL ANGLE</div>
        <div style={{ 
          width: '100px', 
          height: '20px', 
          background: '#111',
          borderRadius: '3px',
          position: 'relative',
          border: '1px solid #444'
        }}>
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '1px',
            background: '#666'
          }}/>
          <div style={{
            position: 'absolute',
            top: '3px',
            left: `${50 + stats.wAngle / 60 * 45}%`,
            transform: 'translateX(-50%)',
            width: '8px',
            height: '14px',
            background: stats.wAngle !== 0 ? '#ffff00' : '#888',
            borderRadius: '2px'
          }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '10px' }}>
          <span>-W (E)</span>
          <span>0</span>
          <span>+W (Q)</span>
        </div>
      </div>
      
      {/* Mini controls reminder */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        background: 'rgba(0,0,20,0.6)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#666'
      }}>
        WASD=Drive | A/D=Turn | Q/E=4D Wheel
      </div>
    </div>
  );
}

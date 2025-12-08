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
      miniMapRenderer.setSize(300, 300);
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
      
      // Add roads to minimap
      roads4D.forEach(road => {
        const scale = 0.3;
        const from = road.from;
        const to = road.to;
        
        // Road line in minimap (X, W as Y, Z negated)
        const roadLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(from[0] * scale, from[3] * 2, -from[2] * scale),
          new THREE.Vector3(to[0] * scale, to[3] * 2, -to[2] * scale)
        ]);
        
        // Color based on W layer
        let roadColor = 0x888888; // Default gray
        const avgW = (from[3] + to[3]) / 2;
        if (avgW > 3) roadColor = 0x4488ff; // Blue for W+
        else if (avgW < -3) roadColor = 0xff4488; // Pink for W-
        else if (from[3] !== to[3]) roadColor = 0xffff44; // Yellow for W-transition roads
        
        const roadLineMat = new THREE.LineBasicMaterial({ color: roadColor, linewidth: 2 });
        const roadLine = new THREE.Line(roadLineGeo, roadLineMat);
        miniMapScene!.add(roadLine);
        miniMapPlatforms.push(roadLine as unknown as THREE.Mesh);
      });
      
      // Add buildings to minimap
      buildings.forEach(b => {
        const scale = 0.3;
        const geo = new THREE.BoxGeometry(b.width * scale, Math.max(b.height * scale * 0.3, 3), b.depth * scale);
        
        // Color based on W layer
        let color = 0x44aa44; // W=0 green
        if (b.w > 3) color = 0x4466aa; // W+ blue
        else if (b.w < -3) color = 0xaa4466; // W- pink
        
        const mat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.7 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.x * scale, b.w * 2 + 2, -b.z * scale);
        miniMapScene!.add(mesh);
        miniMapPlatforms.push(mesh);
      });
      
      // Add boundary box to minimap
      const boundScale = 0.3;
      const boundSize = 150 * boundScale;
      const boundGeo = new THREE.BoxGeometry(boundSize, 8, boundSize);
      const boundEdges = new THREE.EdgesGeometry(boundGeo);
      const boundLine = new THREE.LineSegments(boundEdges, new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.5 }));
      boundLine.position.y = 0;
      miniMapScene!.add(boundLine);
    };

    // ========== 4D CORE ==========
    let rotXW = 0;  // 4D rotation angles
    let rotZW = 0;
    
    // Project 4D point to 3D using proper 4D→3D projection
    function project4D(x: number, y: number, z: number, w: number): THREE.Vector3 {
      // Apply 4D rotations (XW and ZW planes)
      const cosXW = Math.cos(rotXW);
      const sinXW = Math.sin(rotXW);
      const x1 = x * cosXW - w * sinXW;
      const w1 = x * sinXW + w * cosXW;
      
      const cosZW = Math.cos(rotZW);
      const sinZW = Math.sin(rotZW);
      const z1 = z * cosZW - w1 * sinZW;
      const w2 = z * sinZW + w1 * cosZW;
      
      // Perspective projection from 4D to 3D
      const wDist = 5;
      const scale = wDist / (wDist + w2 * 0.05);
      
      return new THREE.Vector3(x1 * scale, y * scale, z1 * scale);
    }
    
    // ========== TRUE 4D SLICING ==========
    // Calculate the 3D cross-section of a 4D hypercube at a given W slice
    // When the slice passes through a hypercube, we see its 3D intersection
    function getHypercubeSlice(objW: number, objWExtent: number, playerW: number): { visible: boolean; scale: number; offset: number } {
      // objW = center of hypercube in W dimension
      // objWExtent = half-width of hypercube in W dimension
      // playerW = current W position (the slice plane)
      
      const relW = playerW - objW;  // Distance from object center to slice
      
      // If we're outside the hypercube's W extent, it's not visible
      if (Math.abs(relW) > objWExtent) {
        return { visible: false, scale: 0, offset: 0 };
      }
      
      // The cross-section size depends on where we slice
      // At the center (relW=0), we see full size
      // At the edges (relW=±extent), we see a point (scale=0)
      // This is like slicing a 3D sphere - you get circles of varying radius
      const normalizedDist = Math.abs(relW) / objWExtent;
      const scale = Math.sqrt(1 - normalizedDist * normalizedDist); // Circular cross-section formula
      
      return { visible: true, scale, offset: relW };
    }
    
    // ========== 4D HYPERCUBES (TRUE TESSERACTS) ==========
    interface Hypercube4D {
      x: number; y: number; z: number; w: number;
      sizeXYZ: number;  // Size in 3D dimensions
      sizeW: number;    // Extent in W dimension
      color: number;
      mesh: THREE.Mesh;
      wireframe: THREE.LineSegments;
      innerCube: THREE.Mesh;  // Shows the 4D depth
    }
    const hypercubes: Hypercube4D[] = [];
    
    function createHypercube(x: number, y: number, z: number, w: number, 
                             sizeXYZ: number, sizeW: number, color: number): Hypercube4D {
      // Outer cube (the 3D shell we see)
      const geo = new THREE.BoxGeometry(sizeXYZ, sizeXYZ, sizeXYZ);
      const mat = new THREE.MeshLambertMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.7 
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + sizeXYZ/2, z);
      scene.add(mesh);
      
      // Wireframe to show edges
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.copy(mesh.position);
      scene.add(wireframe);
      
      // Inner cube (represents the 4D depth - scales based on W slice)
      const innerGeo = new THREE.BoxGeometry(sizeXYZ * 0.6, sizeXYZ * 0.6, sizeXYZ * 0.6);
      const innerMat = new THREE.MeshBasicMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.5,
        wireframe: true 
      });
      const innerCube = new THREE.Mesh(innerGeo, innerMat);
      innerCube.position.copy(mesh.position);
      scene.add(innerCube);
      
      const hc: Hypercube4D = { x, y, z, w, sizeXYZ, sizeW, color, mesh, wireframe, innerCube };
      hypercubes.push(hc);
      return hc;
    }
    
    // ========== 4D HYPERSPHERES ==========
    interface Hypersphere4D {
      x: number; y: number; z: number; w: number;
      radius3D: number;  // Radius in XYZ
      radiusW: number;   // Extent in W
      color: number;
      mesh: THREE.Mesh;
      glow: THREE.Mesh;
    }
    const hyperspheres: Hypersphere4D[] = [];
    
    function createHypersphere(x: number, y: number, z: number, w: number,
                               radius3D: number, radiusW: number, color: number): Hypersphere4D {
      const geo = new THREE.SphereGeometry(radius3D, 16, 12);
      const mat = new THREE.MeshLambertMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        emissive: color,
        emissiveIntensity: 0.2
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + radius3D, z);
      scene.add(mesh);
      
      // Glow sphere
      const glowGeo = new THREE.SphereGeometry(radius3D * 1.3, 12, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2,
        wireframe: true
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(mesh.position);
      scene.add(glow);
      
      const hs: Hypersphere4D = { x, y, z, w, radius3D, radiusW, color, mesh, glow };
      hyperspheres.push(hs);
      return hs;
    }

    // ========== SIMPLE PLATFORMS (LOW POLY) ==========
    interface Platform4D {
      x: number; y: number; z: number; w: number;
      width: number; height: number; depth: number;
      wExtent: number;  // How thick the platform is in W dimension
      color: number;
      mesh: THREE.Mesh;
      isRamp?: boolean;
      rampDir?: number; // 0=+X, 1=-X, 2=+Z, 3=-Z
    }
    const platforms: Platform4D[] = [];
    
    // Create simple box platform with W extent
    function createPlatform(x: number, y: number, z: number, w: number, 
                           width: number, height: number, depth: number, 
                           color: number, isRamp = false, rampDir = 0, wExtent = 8): Platform4D {
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
      
      const p: Platform4D = { x, y, z, w, width, height, depth, wExtent, color, mesh, isRamp, rampDir };
      platforms.push(p);
      return p;
    }
    
    // ========== BUILD THE 4D CITY WORLD ==========
    const WORLD_SIZE = 150; // Smaller bounded world
    const WORLD_HALF = WORLD_SIZE / 2;
    
    // Ground plane (city asphalt)
    const groundGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 1, 1);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a1a22 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    
    // Grid lines (city blocks)
    const gridHelper = new THREE.GridHelper(WORLD_SIZE, 10, 0x00ffff, 0x002233);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);
    
    // === BOUNDARY WALLS (invisible but solid) ===
    const wallHeight = 30;
    const wallMat = new THREE.MeshBasicMaterial({ color: 0xff0044, transparent: true, opacity: 0.15 });
    const wallGeo = new THREE.BoxGeometry(WORLD_SIZE, wallHeight, 2);
    const wallGeoSide = new THREE.BoxGeometry(2, wallHeight, WORLD_SIZE);
    
    // North wall
    const wallN = new THREE.Mesh(wallGeo, wallMat);
    wallN.position.set(0, wallHeight/2, -WORLD_HALF);
    scene.add(wallN);
    // South wall
    const wallS = new THREE.Mesh(wallGeo, wallMat);
    wallS.position.set(0, wallHeight/2, WORLD_HALF);
    scene.add(wallS);
    // East wall
    const wallE = new THREE.Mesh(wallGeoSide, wallMat);
    wallE.position.set(WORLD_HALF, wallHeight/2, 0);
    scene.add(wallE);
    // West wall
    const wallW = new THREE.Mesh(wallGeoSide, wallMat);
    wallW.position.set(-WORLD_HALF, wallHeight/2, 0);
    scene.add(wallW);
    
    // === CITY BUILDINGS AS 4D HYPERBUILDINGS ===
    // Buildings now have W extent - they exist across multiple W slices!
    interface Building4D {
      x: number; z: number; w: number;
      width: number; height: number; depth: number;
      wExtent: number;  // How thick in W dimension
      mesh: THREE.Mesh;
      baseColor: number;
    }
    const buildings: Building4D[] = [];
    
    function createBuilding(x: number, z: number, w: number, width: number, height: number, depth: number, color: number, wExtent = 6) {
      const geo = new THREE.BoxGeometry(width, height, depth);
      const mat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, height/2, z);
      scene.add(mesh);
      buildings.push({ x, z, w, width, height, depth, wExtent, mesh, baseColor: color });
      return mesh;
    }
    
    // City blocks - spread across W layers with W extent
    // W=0 layer (main city - green/teal) - these span W=-6 to W=+6
    createBuilding(-50, -40, 0, 15, 20, 15, 0x226644, 8);
    createBuilding(-50, 40, 0, 12, 15, 12, 0x228855, 8);
    createBuilding(50, -40, 0, 18, 25, 14, 0x227755, 8);
    createBuilding(50, 40, 0, 14, 18, 16, 0x226644, 8);
    createBuilding(-30, 0, 0, 10, 12, 10, 0x228866, 6);
    createBuilding(30, 0, 0, 12, 14, 10, 0x227755, 6);
    
    // W=10 layer (blue district) - spans W=4 to W=16
    createBuilding(40, -30, 10, 12, 22, 12, 0x2244aa, 6);
    createBuilding(40, 30, 10, 14, 18, 14, 0x2255bb, 6);
    createBuilding(60, 0, 10, 10, 28, 10, 0x2266cc, 8);
    
    // W=-10 layer (pink/red district) - spans W=-16 to W=-4
    createBuilding(-40, -30, -10, 14, 20, 14, 0xaa2244, 6);
    createBuilding(-40, 30, -10, 12, 16, 12, 0xbb2255, 6);
    createBuilding(-60, 0, -10, 16, 24, 12, 0xcc2266, 8);
    
    // ========== TRUE 4D OBJECTS ==========
    // Hypercubes - tesseracts that show proper cross-sections!
    createHypercube(0, 0, 50, 0, 12, 10, 0x00ffaa);     // Center forward
    createHypercube(40, 0, 40, 5, 10, 8, 0x00aaff);     // NE, shifted in W
    createHypercube(-40, 0, 40, -5, 10, 8, 0xff00aa);   // NW, shifted in W
    createHypercube(0, 10, 0, 0, 8, 15, 0xffff00);      // Floating center (big W extent!)
    createHypercube(50, 5, 0, 8, 8, 6, 0x00ff00);       // East, in W+
    createHypercube(-50, 5, 0, -8, 8, 6, 0xff0066);     // West, in W-
    
    // Hyperspheres - 4D spheres that grow/shrink as you pass through!
    createHypersphere(25, 0, 25, 3, 5, 8, 0x00ffff);    // Cyan sphere, slight W+
    createHypersphere(-25, 0, 25, -3, 5, 8, 0xff00ff);  // Magenta sphere, slight W-
    createHypersphere(0, 0, -40, 0, 6, 12, 0xffff00);   // Yellow sphere, big W range
    createHypersphere(35, 0, -35, 7, 4, 5, 0x0088ff);   // Blue, W+
    createHypersphere(-35, 0, -35, -7, 4, 5, 0xff8800); // Orange, W-
    
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
    
    // === HYPERROADS (fit within bounded world) ===
    // Main roads in W=0 layer (central green district)
    createRoad([0, 0, -60, 0], [0, 0, 60, 0], 0x334433);  // Main N-S road
    createRoad([-60, 0, 0, 0], [60, 0, 0, 0], 0x334433);  // Main E-W road
    
    // Diagonal hyperroads connecting W layers!
    createRoad([15, 0, 15, 0], [50, 0, 30, 10], 0x0055aa);   // W=0 to W=10 (blue)
    createRoad([-15, 0, 15, 0], [-50, 0, 30, -10], 0xaa0055); // W=0 to W=-10 (pink)
    createRoad([15, 0, -15, 0], [50, 0, -30, 10], 0x0066bb);  // Another W transition
    createRoad([-15, 0, -15, 0], [-50, 0, -30, -10], 0xbb0066);
    
    // Roads in W=10 layer (blue district)
    createRoad([30, 0, -50, 10], [30, 0, 50, 10], 0x0066ff);
    createRoad([30, 0, 0, 10], [65, 0, 0, 10], 0x0077ff);
    
    // Roads in W=-10 layer (pink district)
    createRoad([-30, 0, -50, -10], [-30, 0, 50, -10], 0xff0066);
    createRoad([-30, 0, 0, -10], [-65, 0, 0, -10], 0xff0077);

    // === STARTING AREA (W=0) - Central Plaza ===
    createPlatform(0, 0, 0, 0, 30, 1, 30, 0x00aa44); // Start platform (bigger!)
    
    // === CENTRAL RAMPS - Fun to drive on! ===
    // Ramp pointing +X (drive east to launch)
    createPlatform(20, 0, 0, 0, 20, 5, 8, 0xff6600, true, 0);
    // Ramp pointing -X (drive west to launch)
    createPlatform(-20, 0, 0, 0, 20, 5, 8, 0x66ff00, true, 1);
    // Ramp pointing +Z (drive north to launch)
    createPlatform(0, 0, 20, 0, 8, 5, 20, 0x0066ff, true, 2);
    // Ramp pointing -Z (drive south to launch)
    createPlatform(0, 0, -20, 0, 8, 5, 20, 0xff0066, true, 3);
    
    // Elevated path in W=0
    createPlatform(0, 0, 40, 0, 12, 1, 12, 0x00cc66);
    createPlatform(0, 3, 55, 0, 10, 1, 10, 0x00dd77);
    
    // Ramp at edge
    createPlatform(0, 0, 65, 0, 12, 6, 15, 0xffaa00, true, 2);
    
    // === W=+10 LAYER (blue district) ===
    createPlatform(40, 0, 0, 10, 18, 1, 18, 0x0066ff);
    createPlatform(55, 0, 25, 10, 12, 1, 12, 0x0088ff);
    createPlatform(55, 0, -25, 10, 12, 1, 12, 0x0077ee);
    createPlatform(40, 8, 45, 10, 10, 1, 10, 0x0099ff); // Elevated
    
    // === W=-10 LAYER (pink district) ===
    createPlatform(-40, 0, 0, -10, 18, 1, 18, 0xff0066);
    createPlatform(-55, 0, 25, -10, 12, 1, 12, 0xff0088);
    createPlatform(-55, 0, -25, -10, 12, 1, 12, 0xee0077);
    createPlatform(-40, 8, 45, -10, 10, 1, 10, 0xff0099); // Elevated
    
    // === SPIRAL RAMP (smaller, fits in world) ===
    for (let i = 0; i < 8; i++) {
      const angle = i * 0.6;
      const radius = 30;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius - 40;
      const py = i * 3;
      const pw = (i - 4) * 2.5; // -10 to +7.5
      
      const hue = i / 8;
      const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
      createPlatform(px, py, pz, pw, 8, 2, 8, color.getHex());
    }
    
    // === CORNER RAMPS ===
    createPlatform(55, 0, -55, 5, 15, 8, 20, 0xffff00, true, 3);
    createPlatform(-55, 0, -55, -5, 15, 8, 20, 0xff00ff, true, 3);
    
    // === COLLECTIBLE RINGS (simple toruses) ===
    interface Ring4D {
      x: number; y: number; z: number; w: number;
      mesh: THREE.Mesh;
      collected: boolean;
    }
    const rings: Ring4D[] = [];
    
    const ringGeo = new THREE.TorusGeometry(2, 0.3, 6, 12); // Low poly ring
    const ringPositions = [
      // W=0 rings (along main roads)
      [0, 4, 35, 0], [0, 6, 55, 0], [25, 3, 0, 0],
      // W=10 rings (blue district)
      [40, 4, 0, 10], [55, 5, 25, 10], [40, 12, 45, 10],
      // W=-10 rings (pink district)
      [-40, 4, 0, -10], [-55, 5, 25, -10], [-40, 12, 45, -10],
      // Spiral rings
      [0, 8, -40, -5], [15, 12, -35, 0], [-15, 15, -50, 5],
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
    createHyperPyramid(0, 3, 30, 0, 0, 1, 0, 0x00ff00);   // Points forward (+Z)
    createHyperPyramid(25, 3, 0, 5, 1, 0, 1, 0x0088ff);   // Points to W=+10 area
    createHyperPyramid(-25, 3, 0, -5, -1, 0, -1, 0xff0088); // Points to W=-10 area
    createHyperPyramid(0, 3, -40, 0, 0, -1, 0, 0xff4400);  // Points to back jump
    
    // === BIG CENTRAL HYPERPYRAMID (centerpiece!) ===
    // A massive spinning hyperpyramid right in the plaza - drive around it!
    const centerPyramidGeo = new THREE.TetrahedronGeometry(8, 0);
    const centerPyramidMat = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      emissive: 0x886600,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9
    });
    const centerPyramid = new THREE.Mesh(centerPyramidGeo, centerPyramidMat);
    centerPyramid.position.set(0, 10, 0);
    scene.add(centerPyramid);
    
    // Glow for center pyramid
    const centerGlowGeo = new THREE.TetrahedronGeometry(12, 0);
    const centerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });
    const centerGlow = new THREE.Mesh(centerGlowGeo, centerGlowMat);
    centerGlow.position.set(0, 10, 0);
    scene.add(centerGlow);
    
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
    
    // Jump pads at various locations (fitted to bounded world)
    // === CENTRAL AREA JUMP PADS (more action near spawn!) ===
    createHyperCone(15, 0.5, 15, 0, 0.5, 1.5, 0.5, 0.3, 0x00ffff);    // NE corner - boost into W+
    createHyperCone(-15, 0.5, 15, 0, -0.5, 1.5, 0.5, -0.3, 0xff00ff); // NW corner - boost into W-
    createHyperCone(15, 0.5, -15, 0, 0.5, 1.0, -0.5, 0, 0xffff00);    // SE corner
    createHyperCone(-15, 0.5, -15, 0, -0.5, 1.0, -0.5, 0, 0xff8800);  // SW corner
    
    // === OUTER AREA JUMP PADS ===
    createHyperCone(0, 0.5, 45, 0, 0, 1.2, 0.5, 0, 0x00ffff);      // Forward jump
    createHyperCone(0, 0.5, -45, 0, 0, 1.5, -0.8, 0, 0xff8800);    // Back mega-jump
    createHyperCone(35, 0.5, 0, 5, 0.3, 0.8, 0, 0.5, 0x00ff88);    // Jump into W+
    createHyperCone(-35, 0.5, 0, -5, -0.3, 0.8, 0, -0.5, 0xff00ff);// Jump into W-
    createHyperCone(50, 1, 0, 10, 0, 1.0, 0.3, 0, 0x0066ff);       // W=10 launcher
    createHyperCone(-50, 1, 0, -10, 0, 1.0, -0.3, 0, 0xff0066);    // W=-10 launcher
    createHyperCone(0, 16, 55, 0, 0, 0.5, -0.5, 0, 0xffff00);      // High platform launcher
    
    // === SUPER LAUNCHER (big boost in center back) ===
    createHyperCone(0, 1, -5, 0, 0, 2.5, 0, 0, 0xffffff);          // Center mega-jump!

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
      
      // Check platforms (with TRUE 4D slicing)
      for (const plat of platforms) {
        // Use proper 4D slice calculation
        const slice = getHypercubeSlice(plat.w, plat.wExtent, pw);
        if (!slice.visible || slice.scale < 0.3) continue; // Not solid enough to stand on
        
        // Collision bounds scale with slice (like the visual)
        const scaleXZ = 0.3 + slice.scale * 0.7;
        const halfW = (plat.width / 2) * scaleXZ + 1.5;
        const halfD = (plat.depth / 2) * scaleXZ + 1.5;
        
        const inX = px > plat.x - halfW && px < plat.x + halfW;
        const inZ = pz > plat.z - halfD && pz < plat.z + halfD;
        
        if (inX && inZ) {
          if (plat.isRamp) {
            // Calculate ramp height at player position
            let rampProgress = 0;
            if (plat.rampDir === 2 || plat.rampDir === 3) {
              // Z-direction ramp
              rampProgress = (pz - (plat.z - plat.depth/2 * scaleXZ)) / (plat.depth * scaleXZ);
              if (plat.rampDir === 3) rampProgress = 1 - rampProgress;
            } else {
              // X-direction ramp
              rampProgress = (px - (plat.x - plat.width/2 * scaleXZ)) / (plat.width * scaleXZ);
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
        
        // === BOUNDARY COLLISION ===
        const BOUND = 72; // Slightly inside walls
        if (playerX > BOUND) { playerX = BOUND; speed *= -0.5; }
        if (playerX < -BOUND) { playerX = -BOUND; speed *= -0.5; }
        if (playerZ > BOUND) { playerZ = BOUND; speed *= -0.5; }
        if (playerZ < -BOUND) { playerZ = -BOUND; speed *= -0.5; }
        
        // === W DIMENSION BOUND (keep it fun, not lost!) ===
        const W_BOUND = 15;
        if (playerW > W_BOUND) { playerW = W_BOUND; carAngleW *= 0.5; }
        if (playerW < -W_BOUND) { playerW = -W_BOUND; carAngleW *= 0.5; }
        
        // === BUILDING COLLISIONS (with true 4D slicing) ===
        buildings.forEach(b => {
          // Only collide if within the building's W extent
          const slice = getHypercubeSlice(b.w, b.wExtent, playerW);
          if (slice.visible && slice.scale > 0.3) { // Only solid collision when substantially in slice
            const scaledHalfW = (b.width / 2) * (0.4 + slice.scale * 0.6) + 2;
            const scaledHalfD = (b.depth / 2) * (0.4 + slice.scale * 0.6) + 2;
            if (playerX > b.x - scaledHalfW && playerX < b.x + scaledHalfW &&
                playerZ > b.z - scaledHalfD && playerZ < b.z + scaledHalfD &&
                playerY < b.height + 2) {
              // Push out of building
              const dx = playerX - b.x;
              const dz = playerZ - b.z;
              if (Math.abs(dx / scaledHalfW) > Math.abs(dz / scaledHalfD)) {
                playerX = b.x + (dx > 0 ? scaledHalfW : -scaledHalfW);
              } else {
                playerZ = b.z + (dz > 0 ? scaledHalfD : -scaledHalfD);
              }
              speed *= 0.3; // Lose speed on collision
            }
          }
        });
        
        // === HYPERCUBE COLLISIONS ===
        hypercubes.forEach(hc => {
          const slice = getHypercubeSlice(hc.w, hc.sizeW, playerW);
          if (slice.visible && slice.scale > 0.2) {
            const scaledSize = hc.sizeXYZ * slice.scale / 2 + 1.5;
            const dx = Math.abs(playerX - hc.x);
            const dz = Math.abs(playerZ - hc.z);
            if (dx < scaledSize && dz < scaledSize && playerY < hc.y + hc.sizeXYZ * slice.scale) {
              // You can land on top of hypercubes!
              if (playerY > hc.y + hc.sizeXYZ * slice.scale - 3 && verticalVelocity < 0) {
                playerY = hc.y + hc.sizeXYZ * slice.scale + 0.5;
                verticalVelocity = 0;
                isGrounded = true;
              } else {
                // Side collision
                if (dx > dz) {
                  playerX = hc.x + (playerX > hc.x ? scaledSize : -scaledSize);
                } else {
                  playerZ = hc.z + (playerZ > hc.z ? scaledSize : -scaledSize);
                }
                speed *= 0.5;
              }
            }
          }
        });
        
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
      
      // Platforms: TRUE 4D SLICING - size and opacity based on W slice
      platforms.forEach(plat => {
        const slice = getHypercubeSlice(plat.w, plat.wExtent, playerW);
        
        if (!slice.visible) {
          plat.mesh.visible = false;
        } else {
          plat.mesh.visible = true;
          // Scale based on cross-section (like slicing a hypercube)
          const scaleXZ = 0.3 + slice.scale * 0.7; // Min 30% size
          plat.mesh.scale.set(scaleXZ, 1, scaleXZ);
          
          // Opacity based on how "centered" we are in the slice
          const opacity = 0.3 + slice.scale * 0.7;
          (plat.mesh.material as THREE.MeshLambertMaterial).opacity = opacity;
          
          // 4D projection
          const proj = project4D(plat.x, 0, plat.z, plat.w - playerW);
          plat.mesh.position.set(proj.x, plat.y, proj.z);
        }
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
      
      // === ANIMATE CENTER PYRAMID ===
      centerPyramid.rotation.y = time * 0.5;
      centerPyramid.rotation.x = Math.sin(time * 0.3) * 0.3;
      centerPyramid.position.y = 10 + Math.sin(time) * 2;
      centerGlow.rotation.y = -time * 0.3;
      centerGlow.rotation.z = time * 0.2;
      centerGlow.position.y = centerPyramid.position.y;
      
      // 4D project center pyramid based on player W
      const centerProj = project4D(0, 0, 0, -playerW);
      centerPyramid.position.x = centerProj.x;
      centerPyramid.position.z = centerProj.z;
      centerGlow.position.x = centerProj.x;
      centerGlow.position.z = centerProj.z;
      
      // === TRUE 4D HYPERCUBES - Cross-section visualization! ===
      hypercubes.forEach(hc => {
        const slice = getHypercubeSlice(hc.w, hc.sizeW, playerW);
        
        if (!slice.visible) {
          hc.mesh.visible = false;
          hc.wireframe.visible = false;
          hc.innerCube.visible = false;
        } else {
          hc.mesh.visible = true;
          hc.wireframe.visible = true;
          hc.innerCube.visible = true;
          
          // The 3D cross-section SIZE changes based on where we slice!
          // At center: full size. At edges: smaller (like slicing a tesseract)
          const crossSectionScale = slice.scale;
          hc.mesh.scale.set(crossSectionScale, crossSectionScale, crossSectionScale);
          hc.wireframe.scale.copy(hc.mesh.scale);
          
          // Inner cube shows the "depth" into W - smaller when we're at the surface
          const innerScale = crossSectionScale * 0.6 * (1 - Math.abs(slice.offset) / hc.sizeW * 0.5);
          hc.innerCube.scale.set(innerScale, innerScale, innerScale);
          
          // Opacity based on slice depth
          const opacity = 0.3 + crossSectionScale * 0.6;
          (hc.mesh.material as THREE.MeshLambertMaterial).opacity = opacity;
          (hc.wireframe.material as THREE.LineBasicMaterial).opacity = opacity * 0.8;
          (hc.innerCube.material as THREE.MeshBasicMaterial).opacity = opacity * 0.4;
          
          // 4D projection position
          const proj = project4D(hc.x, hc.y, hc.z, hc.w - playerW);
          hc.mesh.position.set(proj.x, hc.y + hc.sizeXYZ/2 * crossSectionScale, proj.z);
          hc.wireframe.position.copy(hc.mesh.position);
          hc.innerCube.position.copy(hc.mesh.position);
          
          // Rotate for visual interest
          hc.mesh.rotation.y = time * 0.3;
          hc.wireframe.rotation.y = time * 0.3;
          hc.innerCube.rotation.y = -time * 0.5;
          hc.innerCube.rotation.x = time * 0.2;
        }
      });
      
      // === TRUE 4D HYPERSPHERES - Sphere cross-sections! ===
      // A 4D sphere sliced gives a 3D sphere that grows/shrinks
      hyperspheres.forEach(hs => {
        const slice = getHypercubeSlice(hs.w, hs.radiusW, playerW);
        
        if (!slice.visible) {
          hs.mesh.visible = false;
          hs.glow.visible = false;
        } else {
          hs.mesh.visible = true;
          hs.glow.visible = true;
          
          // Sphere cross-section radius follows the circle formula
          const sphereScale = slice.scale;
          hs.mesh.scale.set(sphereScale, sphereScale, sphereScale);
          hs.glow.scale.set(sphereScale * 1.3, sphereScale * 1.3, sphereScale * 1.3);
          
          // Opacity
          const opacity = 0.3 + sphereScale * 0.6;
          (hs.mesh.material as THREE.MeshLambertMaterial).opacity = opacity;
          (hs.glow.material as THREE.MeshBasicMaterial).opacity = opacity * 0.3;
          
          // 4D projection
          const proj = project4D(hs.x, hs.y, hs.z, hs.w - playerW);
          hs.mesh.position.set(proj.x, hs.y + hs.radius3D * sphereScale, proj.z);
          hs.glow.position.copy(hs.mesh.position);
          
          // Pulse effect
          const pulse = 1 + Math.sin(time * 3) * 0.1;
          hs.glow.scale.multiplyScalar(pulse);
          hs.glow.rotation.y = time;
        }
      });
      
      // === BUILDINGS with 4D slicing ===
      buildings.forEach(b => {
        const slice = getHypercubeSlice(b.w, b.wExtent, playerW);
        
        if (!slice.visible) {
          b.mesh.visible = false;
        } else {
          b.mesh.visible = true;
          
          // Building cross-section - width/depth scale, height stays
          const scaleXZ = 0.4 + slice.scale * 0.6;
          b.mesh.scale.set(scaleXZ, 1, scaleXZ);
          
          // Opacity
          const opacity = 0.4 + slice.scale * 0.6;
          (b.mesh.material as THREE.MeshLambertMaterial).opacity = opacity;
          
          // 4D projection
          const proj = project4D(b.x, 0, b.z, b.w - playerW);
          b.mesh.position.set(proj.x, b.height/2, proj.z);
        }
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
        const scale = 0.4;
        miniMapPlayer.position.set(playerX * scale, playerW * 3, -playerZ * scale);
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
        
        // Camera follows player with 4D rotation influence (CTRL+mouse)
        const camOrbitRadius = 100;
        const camOrbitHeight = 80;
        // Apply rotXW and rotZW to orbit the minimap camera
        const miniCamX = playerX * scale + Math.sin(rotXW) * camOrbitRadius * 0.5;
        const miniCamZ = -playerZ * scale + Math.cos(rotZW) * camOrbitRadius;
        const miniCamY = camOrbitHeight + playerW * 3 + Math.sin(rotZW) * 30;
        
        miniMapCamera.position.set(miniCamX, miniCamY, miniCamZ);
        miniMapCamera.lookAt(playerX * scale, playerW * 3, -playerZ * scale);
        
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
        width: '304px',
        height: '340px',
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
          width={300}
          height={300}
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

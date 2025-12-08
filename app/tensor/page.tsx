"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Stats {
  speed: number;
  wPos: number;
  airTime: number;
  money: number;
}

export default function TensorGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<Stats>({ speed: 0, wPos: 0, airTime: 0, money: 0 });
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
    
    // Wheels (just cylinders)
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    [[-1.5, 0.6, 1.5], [1.5, 0.6, 1.5], [-1.5, 0.6, -1.5], [1.5, 0.6, -1.5]].forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      carGroup.add(wheel);
    });
    
    // 4D shell indicator
    const shellGeo = new THREE.BoxGeometry(4, 2.5, 6);
    const shellMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    const carShell = new THREE.Mesh(shellGeo, shellMat);
    carShell.position.y = 1.25;
    carGroup.add(carShell);
    
    scene.add(carGroup);

    // ========== GAME STATE ==========
    const keys: Record<string, boolean> = {};
    
    // Player position in 4D
    let playerX = 0;
    let playerY = 2;
    let playerZ = 0;
    let playerW = 0;
    
    // Car physics
    let carAngle = 0; // Facing direction
    let speed = 0;
    let verticalVelocity = 0;
    let isGrounded = true;
    let airTime = 0;
    let money = 0;
    
    // Physics constants
    const maxSpeed = 1.2;
    const acceleration = 0.04;
    const braking = 0.06;
    const friction = 0.015;
    const turnSpeed = 0.045;
    const gravity = 0.025;
    const jumpForce = 0.6;
    const wSpeed = 0.3;
    
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
        rotZW -= e.movementY * mouseSens * 2;
        setRotMode('4D');
      } else {
        // Normal: rotate camera in 3D
        camYaw -= e.movementX * mouseSens;
        camPitch -= e.movementY * mouseSens;
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
        // === CAR DRIVING CONTROLS ===
        // W/S = forward/backward
        if (keys['w']) {
          speed = Math.min(speed + acceleration, maxSpeed);
        } else if (keys['s']) {
          speed = Math.max(speed - braking, -maxSpeed * 0.4);
        } else {
          // Friction
          if (speed > 0) speed = Math.max(0, speed - friction);
          if (speed < 0) speed = Math.min(0, speed + friction);
        }
        
        // A/D = turn (only when moving)
        if (Math.abs(speed) > 0.05) {
          const turnAmount = turnSpeed * (speed > 0 ? 1 : -1);
          if (keys['a']) carAngle += turnAmount;
          if (keys['d']) carAngle -= turnAmount;
        }
        
        // Q/E = move in W dimension
        if (keys['q']) playerW += wSpeed;
        if (keys['e']) playerW -= wSpeed;
        
        // SPACE = jump (when grounded)
        if (keys[' '] && isGrounded) {
          verticalVelocity = jumpForce;
          isGrounded = false;
        }
        
        // === PHYSICS ===
        // Move car forward
        const moveX = Math.sin(carAngle) * speed;
        const moveZ = Math.cos(carAngle) * speed;
        
        playerX += moveX;
        playerZ += moveZ;
        
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
        carGroup.rotation.y = carAngle;
        
        // Car tilt based on speed/air
        carGroup.rotation.x = isGrounded ? 0 : -verticalVelocity * 0.3;
        carGroup.rotation.z = isGrounded ? -speed * 0.1 : 0;
        
        // 4D shell effect
        carShell.rotation.y = time;
        const wPulse = Math.sin(playerW * 0.3) * 0.2;
        carShell.scale.set(1 + wPulse, 1 + wPulse, 1 + wPulse);
      }
      
      // === UPDATE 4D OBJECTS ===
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
        money: money
      });
      
      renderer.render(scene, camera);
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
          maxWidth: '450px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px', color: '#ff00ff' }}>4D PLATFORMER</div>
          <div style={{ fontSize: '14px', marginBottom: '20px', color: '#888' }}>Low-poly optimized</div>
          <div style={{ marginBottom: '20px' }}>Click to Play</div>
          
          <div style={{ fontSize: '14px', textAlign: 'left', lineHeight: '1.8' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold' }}>🚗 DRIVING:</div>
            <div>W / S - Forward / Backward</div>
            <div>A / D - Turn Left / Right</div>
            <div>SPACE - Jump</div>
            
            <div style={{ color: '#ff00ff', fontWeight: 'bold', marginTop: '12px' }}>🌀 4D CONTROLS:</div>
            <div>Q / E - Move through W dimension</div>
            <div>Hold CTRL + Mouse - Rotate 4D view</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Platforms fade when far in W.<br/>
              Jump between W-layers to reach new areas!
            </div>
            
            <div style={{ color: '#ffff00', fontWeight: 'bold', marginTop: '12px' }}>🎯 GOAL:</div>
            <div>Collect rings, get airtime bonuses!</div>
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
        <div style={{ color: '#ff00ff' }}>W: {stats.wPos}</div>
        <div style={{ color: '#00ff00' }}>${stats.money}</div>
        {stats.airTime > 10 && (
          <div style={{ color: '#ffff00' }}>🚀 AIR: {stats.airTime}</div>
        )}
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
        <div style={{ marginBottom: '6px' }}>W-AXIS</div>
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
          <span>E ←</span>
          <span>→ Q</span>
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
        WASD + SPACE | Q/E = W | CTRL+Mouse = 4D
      </div>
    </div>
  );
}

// 4D Engine Integration utilities
// Bridges HyperMath with Three.js rendering

import * as THREE from 'three';
import { 
  Vec4, Vec3, 
  project4Dto3D, 
  getHypershapeSlice, 
  tesseractVertices, 
  tesseractEdges,
  vec4,
  rotate4D,
  RotationAngles4D
} from './HyperMath';

// ========== ENTITY SYSTEM ==========

export interface Entity4D {
  id: string;
  pos4: Vec4;
  vel4?: Vec4;  // 4D velocity
  size4?: Vec4; // 4D bounding box half-extents
  mesh?: THREE.Object3D;
  type: 'player' | 'building' | 'vehicle' | 'pickup' | 'portal' | 'npc';
  data?: Record<string, any>;
}

export interface Portal4D {
  id: string;
  pos4: Vec4;
  targetW: number;  // Destination W coordinate
  radius: number;
  mesh?: THREE.Object3D;
  effectMesh?: THREE.Object3D;
}

// ========== RENDERING ==========

/**
 * Update a Three.js mesh based on 4D position and camera
 */
export function updateEntityMeshFrom4D(
  entity: Entity4D,
  cameraW: number,
  options: {
    focal?: number;
    rotationXW?: number;
    rotationZW?: number;
    maxWDistance?: number;
    ghostOpacity?: number;
  } = {}
) {
  if (!entity.mesh) return;

  const { 
    focal = 50, 
    rotationXW = 0, 
    rotationZW = 0, 
    maxWDistance = 20,
    ghostOpacity = 0.1 
  } = options;

  // Project 4D to 3D
  const projected = project4Dto3D(entity.pos4, { 
    cameraW, 
    focal,
    rotationXW,
    rotationZW 
  });

  entity.mesh.position.set(projected.x, projected.y, projected.z);

  // Scale based on W distance (perspective effect)
  const wDist = Math.abs(entity.pos4.w - cameraW);
  const scale = Math.max(0.2, Math.min(3, focal / (focal + wDist * 2)));
  entity.mesh.scale.setScalar(scale);

  // Visibility and opacity based on W distance
  if (wDist > maxWDistance) {
    entity.mesh.visible = false;
  } else {
    entity.mesh.visible = true;
    
    // Apply opacity to materials
    entity.mesh.traverse((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.Material;
        if ('opacity' in mat) {
          (mat as any).transparent = true;
          (mat as any).opacity = Math.max(ghostOpacity, 1 - (wDist / maxWDistance));
        }
      }
    });
  }
}

/**
 * Update mesh using true 4D slicing (hypershape cross-section)
 */
export function updateEntityMeshWithSlicing(
  entity: Entity4D,
  playerW: number,
  options: {
    focal?: number;
    rotationXW?: number;
    rotationZW?: number;
  } = {}
) {
  if (!entity.mesh || !entity.size4) return;

  const wExtent = entity.size4.w;
  const slice = getHypershapeSlice(entity.pos4.w, wExtent, playerW);

  if (!slice.visible) {
    entity.mesh.visible = false;
    return;
  }

  entity.mesh.visible = true;

  // Project position
  const projected = project4Dto3D(entity.pos4, {
    cameraW: playerW,
    focal: options.focal ?? 50,
    rotationXW: options.rotationXW ?? 0,
    rotationZW: options.rotationZW ?? 0,
  });

  entity.mesh.position.set(projected.x, projected.y, projected.z);

  // Scale based on cross-section
  entity.mesh.scale.set(slice.scale, slice.scale, slice.scale);

  // Apply opacity
  entity.mesh.traverse((child) => {
    if ((child as THREE.Mesh).material) {
      const mat = (child as THREE.Mesh).material as THREE.Material;
      if ('opacity' in mat) {
        (mat as any).transparent = true;
        (mat as any).opacity = slice.opacity;
      }
    }
  });
}

// ========== TESSERACT RENDERING ==========

/**
 * Create a Three.js representation of a tesseract (4D hypercube)
 * Returns line geometry that can be updated as the tesseract rotates
 */
export function createTesseractMesh(
  size: number = 10,
  color: number = 0x00ffff
): { 
  mesh: THREE.LineSegments; 
  update: (rotation: RotationAngles4D, cameraW: number, focal?: number) => void;
} {
  const vertices = tesseractVertices();
  const edges = tesseractEdges();

  // Create geometry with enough positions for all edges
  const positions = new Float32Array(edges.length * 6); // 2 points * 3 coords per edge
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({ 
    color, 
    transparent: true, 
    opacity: 0.8 
  });
  const mesh = new THREE.LineSegments(geometry, material);

  const update = (rotation: RotationAngles4D, cameraW: number, focal: number = 50) => {
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    
    edges.forEach((edge, i) => {
      const v1_4d = vec4(
        vertices[edge[0]].x * size,
        vertices[edge[0]].y * size,
        vertices[edge[0]].z * size,
        vertices[edge[0]].w * size
      );
      const v2_4d = vec4(
        vertices[edge[1]].x * size,
        vertices[edge[1]].y * size,
        vertices[edge[1]].z * size,
        vertices[edge[1]].w * size
      );

      // Rotate in 4D
      const v1_rot = rotate4D(v1_4d, rotation);
      const v2_rot = rotate4D(v2_4d, rotation);

      // Project to 3D
      const v1_3d = project4Dto3D(v1_rot, { cameraW, focal });
      const v2_3d = project4Dto3D(v2_rot, { cameraW, focal });

      // Update buffer
      posAttr.setXYZ(i * 2, v1_3d.x, v1_3d.y, v1_3d.z);
      posAttr.setXYZ(i * 2 + 1, v2_3d.x, v2_3d.y, v2_3d.z);
    });

    posAttr.needsUpdate = true;
  };

  // Initial update
  update({ xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 }, 0);

  return { mesh, update };
}

/**
 * Create a hypersphere visualization (nested spheres showing 4D depth)
 */
export function createHypersphereMesh(
  radius: number = 5,
  color: number = 0xff00ff
): THREE.Group {
  const group = new THREE.Group();

  // Multiple concentric spheres to show 4D depth
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const r = radius * (1 - i * 0.2);
    const opacity = 0.8 - i * 0.15;
    
    const geo = new THREE.SphereGeometry(r, 16, 12);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      wireframe: i > 0, // Inner layers as wireframe
    });
    const sphere = new THREE.Mesh(geo, mat);
    group.add(sphere);
  }

  return group;
}

// ========== PORTAL SYSTEM ==========

export function createPortalMesh(
  radius: number = 5,
  targetW: number
): THREE.Group {
  const group = new THREE.Group();

  // Portal ring
  const ringGeo = new THREE.TorusGeometry(radius, 0.5, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: targetW > 0 ? 0x0066ff : 0xff0066,
    transparent: true,
    opacity: 0.8,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // Portal effect (spinning disc)
  const discGeo = new THREE.CircleGeometry(radius * 0.9, 32);
  const discMat = new THREE.MeshBasicMaterial({
    color: targetW > 0 ? 0x00aaff : 0xff00aa,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = Math.PI / 2;
  group.add(disc);

  // Store animation data
  (group as any).portalData = { disc, targetW };

  return group;
}

export function animatePortal(group: THREE.Group, time: number) {
  const data = (group as any).portalData;
  if (!data) return;

  data.disc.rotation.z = time * 2;
  data.disc.material.opacity = 0.2 + Math.sin(time * 3) * 0.1;
}

// ========== SLICE MANAGEMENT ==========

export interface Slice {
  w: number;
  name: string;
  color: string;
  entities: Entity4D[];
  loaded: boolean;
}

export class SliceManager {
  slices: Map<number, Slice> = new Map();
  loadedRange: number = 3; // Load slices within ±3 of player

  constructor() {
    // Default slices
    this.addSlice(0, 'Main City', '#00ff66');
    this.addSlice(10, 'Blue District', '#0066ff');
    this.addSlice(-10, 'Pink District', '#ff0066');
  }

  addSlice(w: number, name: string, color: string) {
    this.slices.set(w, {
      w,
      name,
      color,
      entities: [],
      loaded: false,
    });
  }

  getSlice(w: number): Slice | undefined {
    return this.slices.get(Math.round(w));
  }

  getNearbySlices(playerW: number): Slice[] {
    const nearby: Slice[] = [];
    this.slices.forEach((slice) => {
      if (Math.abs(slice.w - playerW) <= this.loadedRange) {
        nearby.push(slice);
      }
    });
    return nearby;
  }

  getSlicesForUI(): { w: number; name: string; color: string }[] {
    return Array.from(this.slices.values()).map(s => ({
      w: s.w,
      name: s.name,
      color: s.color,
    }));
  }
}

// ========== GHOST TRACES ==========

export interface GhostTrace {
  userId: string;
  pos4: Vec4;
  timestamp: number;
  action?: string;
}

/**
 * Render ghost traces from other players
 */
export function createGhostMesh(trace: GhostTrace): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1, 8, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  
  // Store trace data
  (mesh as any).traceData = trace;
  
  return mesh;
}

export function updateGhostMesh(
  mesh: THREE.Mesh,
  playerW: number,
  playerTime: number
) {
  const trace = (mesh as any).traceData as GhostTrace;
  if (!trace) return;

  // Project position
  const projected = project4Dto3D(trace.pos4, { cameraW: playerW });
  mesh.position.set(projected.x, projected.y, projected.z);

  // Fade based on W distance and time
  const wDist = Math.abs(trace.pos4.w - playerW);
  const age = (playerTime - trace.timestamp) / 1000; // seconds
  const wFade = Math.max(0, 1 - wDist / 10);
  const timeFade = Math.max(0, 1 - age / 30); // Fade over 30 seconds

  (mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 * wFade * timeFade;
  mesh.visible = wFade > 0.1 && timeFade > 0.1;
}

// 4D utilities and projection functions for the 4D GTA engine
// Supports both slicing (discrete W layers) and true 4D projection

export type Vec4 = { x: number; y: number; z: number; w: number };
export type Vec3 = { x: number; y: number; z: number };

// ========== BASIC OPERATIONS ==========

export function vec4(x: number, y: number, z: number, w: number): Vec4 {
  return { x, y, z, w };
}

export function vec4ToString(v: Vec4): string {
  return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}, ${v.w.toFixed(2)})`;
}

export function vec4Add(a: Vec4, b: Vec4): Vec4 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z, w: a.w + b.w };
}

export function vec4Sub(a: Vec4, b: Vec4): Vec4 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z, w: a.w - b.w };
}

export function vec4Scale(v: Vec4, s: number): Vec4 {
  return { x: v.x * s, y: v.y * s, z: v.z * s, w: v.w * s };
}

export function vec4Length(v: Vec4): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z + v.w * v.w);
}

export function vec4Distance(a: Vec4, b: Vec4): number {
  return vec4Length(vec4Sub(a, b));
}

export function vec4Normalize(v: Vec4): Vec4 {
  const len = vec4Length(v);
  if (len === 0) return { x: 0, y: 0, z: 0, w: 0 };
  return vec4Scale(v, 1 / len);
}

export function vec4Dot(a: Vec4, b: Vec4): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

export function lerp4(a: Vec4, b: Vec4, t: number): Vec4 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
    w: a.w + (b.w - a.w) * t,
  };
}

// ========== 4D ROTATION MATRICES ==========

// 4D has 6 rotation planes: XY, XZ, XW, YZ, YW, ZW
// We primarily use XW and ZW for gameplay (rotating view into/out of W)

export interface RotationAngles4D {
  xy: number;  // Standard roll
  xz: number;  // Standard yaw
  xw: number;  // Rotate X into W (key for 4D view)
  yz: number;  // Standard pitch
  yw: number;  // Rotate Y into W
  zw: number;  // Rotate Z into W (key for 4D view)
}

export function defaultRotation4D(): RotationAngles4D {
  return { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 };
}

// Apply 4D rotation to a point
export function rotate4D(v: Vec4, angles: RotationAngles4D): Vec4 {
  let { x, y, z, w } = v;

  // XW rotation (most important for 4D driving)
  if (angles.xw !== 0) {
    const cos = Math.cos(angles.xw);
    const sin = Math.sin(angles.xw);
    const newX = x * cos - w * sin;
    const newW = x * sin + w * cos;
    x = newX;
    w = newW;
  }

  // ZW rotation
  if (angles.zw !== 0) {
    const cos = Math.cos(angles.zw);
    const sin = Math.sin(angles.zw);
    const newZ = z * cos - w * sin;
    const newW = z * sin + w * cos;
    z = newZ;
    w = newW;
  }

  // YW rotation
  if (angles.yw !== 0) {
    const cos = Math.cos(angles.yw);
    const sin = Math.sin(angles.yw);
    const newY = y * cos - w * sin;
    const newW = y * sin + w * cos;
    y = newY;
    w = newW;
  }

  // Standard 3D rotations (XY, XZ, YZ) can be applied if needed
  // but for gameplay we mostly use the W-plane rotations

  return { x, y, z, w };
}

// ========== 4D → 3D PROJECTION ==========

export interface ProjectionOptions {
  cameraW?: number;      // Camera position in W dimension
  focal?: number;        // Focal length for W perspective
  rotationXW?: number;   // Pre-projection rotation in XW plane
  rotationZW?: number;   // Pre-projection rotation in ZW plane
}

/**
 * Project a 4D point to 3D using perspective projection.
 * 
 * The W dimension is treated like depth - objects further in W appear smaller.
 * This creates a true 4D→3D perspective effect.
 */
export function project4Dto3D(v: Vec4, options: ProjectionOptions = {}): Vec3 {
  const cameraW = options.cameraW ?? 0;
  const focal = options.focal ?? 50;
  const rotXW = options.rotationXW ?? 0;
  const rotZW = options.rotationZW ?? 0;

  // First apply 4D rotations (this lets us "look around" in 4D)
  let { x, y, z, w } = v;

  // XW rotation
  if (rotXW !== 0) {
    const cos = Math.cos(rotXW);
    const sin = Math.sin(rotXW);
    const newX = x * cos - w * sin;
    const newW = x * sin + w * cos;
    x = newX;
    w = newW;
  }

  // ZW rotation
  if (rotZW !== 0) {
    const cos = Math.cos(rotZW);
    const sin = Math.sin(rotZW);
    const newZ = z * cos - w * sin;
    const newW = z * sin + w * cos;
    z = newZ;
    w = newW;
  }

  // Perspective projection based on W distance from camera
  const deltaW = w - cameraW;
  const denom = Math.max(0.1, focal + deltaW);
  const scale = focal / denom;

  return {
    x: x * scale,
    y: y * scale,
    z: z * scale,
  };
}

// ========== 4D SLICING (for collision & visibility) ==========

export interface SliceResult {
  visible: boolean;
  scale: number;      // 0-1, how much of the cross-section is visible
  offset: number;     // Distance from slice center
  opacity: number;    // Suggested opacity for rendering
}

/**
 * Calculate the 3D cross-section of a 4D hypershape at a given W slice.
 * 
 * This is the mathematical equivalent of slicing a 3D object with a 2D plane.
 * A hypersphere sliced gives spheres of varying radius.
 * A hypercube sliced gives cubes of varying size.
 * 
 * @param objectW - Center of the 4D object in W dimension
 * @param objectWExtent - Half-width of object in W dimension
 * @param sliceW - The W position of the slice plane (player's W position)
 */
export function getHypershapeSlice(
  objectW: number,
  objectWExtent: number,
  sliceW: number
): SliceResult {
  const relW = sliceW - objectW;
  
  // Outside the object's W extent - not visible
  if (Math.abs(relW) > objectWExtent) {
    return { visible: false, scale: 0, offset: relW, opacity: 0 };
  }
  
  // Calculate cross-section scale using the hypersphere formula
  // At center: scale = 1 (full size)
  // At edge: scale = 0 (point)
  const normalizedDist = Math.abs(relW) / objectWExtent;
  const scale = Math.sqrt(1 - normalizedDist * normalizedDist);
  
  // Opacity falls off near edges
  const opacity = 0.3 + scale * 0.7;
  
  return { visible: true, scale, offset: relW, opacity };
}

/**
 * Simpler linear slice (for less dramatic effect)
 */
export function getLinearSlice(
  objectW: number,
  objectWExtent: number,
  sliceW: number
): SliceResult {
  const relW = sliceW - objectW;
  
  if (Math.abs(relW) > objectWExtent) {
    return { visible: false, scale: 0, offset: relW, opacity: 0 };
  }
  
  const normalizedDist = Math.abs(relW) / objectWExtent;
  const scale = 1 - normalizedDist;
  const opacity = 0.2 + scale * 0.8;
  
  return { visible: true, scale, offset: relW, opacity };
}

// ========== 4D SHAPES ==========

// Vertices of a tesseract (4D hypercube) centered at origin with half-size 1
export function tesseractVertices(): Vec4[] {
  const vertices: Vec4[] = [];
  for (let x of [-1, 1]) {
    for (let y of [-1, 1]) {
      for (let z of [-1, 1]) {
        for (let w of [-1, 1]) {
          vertices.push({ x, y, z, w });
        }
      }
    }
  }
  return vertices; // 16 vertices
}

// Edges of a tesseract (pairs of vertex indices)
export function tesseractEdges(): [number, number][] {
  const edges: [number, number][] = [];
  const vertices = tesseractVertices();
  
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      // Two vertices are connected if they differ in exactly one coordinate
      const v1 = vertices[i];
      const v2 = vertices[j];
      let diffs = 0;
      if (v1.x !== v2.x) diffs++;
      if (v1.y !== v2.y) diffs++;
      if (v1.z !== v2.z) diffs++;
      if (v1.w !== v2.w) diffs++;
      
      if (diffs === 1) {
        edges.push([i, j]);
      }
    }
  }
  return edges; // 32 edges
}

// 16-cell (4D cross-polytope / hyperoctahedron)
export function sixteenCellVertices(): Vec4[] {
  return [
    { x: 1, y: 0, z: 0, w: 0 },
    { x: -1, y: 0, z: 0, w: 0 },
    { x: 0, y: 1, z: 0, w: 0 },
    { x: 0, y: -1, z: 0, w: 0 },
    { x: 0, y: 0, z: 1, w: 0 },
    { x: 0, y: 0, z: -1, w: 0 },
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 0, y: 0, z: 0, w: -1 },
  ];
}

// 5-cell (4D simplex / hypertetrahedron)
export function fiveCellVertices(): Vec4[] {
  const a = 1 / Math.sqrt(10);
  const b = 1 / Math.sqrt(6);
  const c = 1 / Math.sqrt(3);
  return [
    { x: 4 * a, y: 0, z: 0, w: 0 },
    { x: -a, y: 3 * b, z: 0, w: 0 },
    { x: -a, y: -b, z: 2 * c, w: 0 },
    { x: -a, y: -b, z: -c, w: Math.sqrt(2 / 5) },
    { x: -a, y: -b, z: -c, w: -Math.sqrt(2 / 5) },
  ];
}

// ========== COLLISION HELPERS ==========

/**
 * Check if a 4D point is inside a 4D axis-aligned bounding box
 */
export function pointInAABB4D(
  point: Vec4,
  boxCenter: Vec4,
  boxHalfExtents: Vec4
): boolean {
  return (
    Math.abs(point.x - boxCenter.x) <= boxHalfExtents.x &&
    Math.abs(point.y - boxCenter.y) <= boxHalfExtents.y &&
    Math.abs(point.z - boxCenter.z) <= boxHalfExtents.z &&
    Math.abs(point.w - boxCenter.w) <= boxHalfExtents.w
  );
}

/**
 * Check if a 4D point is inside a 4D hypersphere
 */
export function pointInHypersphere(
  point: Vec4,
  sphereCenter: Vec4,
  radius: number
): boolean {
  return vec4Distance(point, sphereCenter) <= radius;
}

/**
 * Get the closest point on a 4D AABB to a given point
 */
export function closestPointOnAABB4D(
  point: Vec4,
  boxCenter: Vec4,
  boxHalfExtents: Vec4
): Vec4 {
  return {
    x: Math.max(boxCenter.x - boxHalfExtents.x, Math.min(boxCenter.x + boxHalfExtents.x, point.x)),
    y: Math.max(boxCenter.y - boxHalfExtents.y, Math.min(boxCenter.y + boxHalfExtents.y, point.y)),
    z: Math.max(boxCenter.z - boxHalfExtents.z, Math.min(boxCenter.z + boxHalfExtents.z, point.z)),
    w: Math.max(boxCenter.w - boxHalfExtents.w, Math.min(boxCenter.w + boxHalfExtents.w, point.w)),
  };
}

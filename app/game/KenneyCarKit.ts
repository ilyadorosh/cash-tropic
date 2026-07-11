import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type KenneyCarModel =
  | "ambulance"
  | "delivery"
  | "firetruck"
  | "garbage-truck"
  | "hatchback-sports"
  | "police"
  | "race-future"
  | "sedan"
  | "sedan-sports"
  | "suv-luxury"
  | "taxi"
  | "truck"
  | "van";

type MountOptions = {
  /** Match the model's longest ground-plane side to this world-space size. */
  targetLength: number;
  /** Cheap geometry shown until the GLB has loaded. */
  fallback?: THREE.Object3D[];
  /** Rotate models whose authored forward axis differs from the host vehicle. */
  rotationY?: number;
};

const BASE_URL = "/models/kenney-car-kit";
const loader = new GLTFLoader();
const templateCache = new Map<KenneyCarModel, Promise<THREE.Group>>();

function disposeVehicleObject(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    // Textures are shared with the cached template. Material.dispose() does
    // not dispose them, which is exactly what we want for other live clones.
    materials.forEach((material) => material.dispose());
  });
}

function loadTemplate(model: KenneyCarModel) {
  const cached = templateCache.get(model);
  if (cached) return cached;

  const request = loader
    .loadAsync(`${BASE_URL}/${model}.glb`)
    .then((gltf) => gltf.scene)
    .catch((error) => {
      templateCache.delete(model);
      throw error;
    });
  templateCache.set(model, request);
  return request;
}

function cloneForVehicle(template: THREE.Group) {
  const clone = template.clone(true);
  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.geometry = child.geometry.clone();
    // Vehicle damage changes material color. Do not let one damaged clone
    // darken every other car that came from the cached GLB template.
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : child.material.clone();
  });
  return clone;
}

/**
 * Replaces a procedural loading silhouette with a Kenney GLB while keeping
 * the host group intact. Movement, collision, entering, and damage therefore
 * continue to operate on the same stable object.
 */
export async function mountKenneyCar(
  host: THREE.Group,
  model: KenneyCarModel,
  { targetLength, fallback = [], rotationY = 0 }: MountOptions,
) {
  const loadToken = Symbol(model);
  host.userData.kenneyLoadToken = loadToken;

  try {
    const template = await loadTemplate(model);
    if (host.userData.kenneyLoadToken !== loadToken) return null;

    const visual = cloneForVehicle(template);
    visual.name = `kenney-${model}`;
    visual.rotation.y = rotationY;

    const authoredBounds = new THREE.Box3().setFromObject(visual);
    const authoredSize = authoredBounds.getSize(new THREE.Vector3());
    const authoredLength = Math.max(authoredSize.x, authoredSize.z, 0.001);
    const scale = targetLength / authoredLength;
    visual.scale.setScalar(scale);

    // Center the model over the host origin and put its tires on y=0.
    const bounds = new THREE.Box3().setFromObject(visual);
    const center = bounds.getCenter(new THREE.Vector3());
    visual.position.set(-center.x, -bounds.min.y, -center.z);
    visual.userData.kenneyModel = model;
    host.add(visual);

    fallback.forEach((part) => {
      if (part.parent === host) {
        host.remove(part);
        disposeVehicleObject(part);
      }
    });
    host.userData.kenneyModel = model;
    return visual;
  } catch (error) {
    console.warn(`Could not load Kenney car model: ${model}`, error);
    return null;
  }
}

export function disposeKenneyCar(host: THREE.Object3D) {
  host.userData.kenneyLoadToken = null;
  disposeVehicleObject(host);
}

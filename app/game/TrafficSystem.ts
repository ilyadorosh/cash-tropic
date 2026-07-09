// TrafficSystem. ts - NPC vehicles that follow roads

import * as THREE from "three";
import {
  TrafficNode,
  findPath,
  generateTrafficNetwork,
  NUERNBERG_STREETS,
} from "./CityLayout";

export interface TrafficVehicle {
  id: string;
  mesh: THREE.Group;
  currentNode: TrafficNode;
  targetNode: TrafficNode | null;
  path: TrafficNode[];
  pathIndex: number;
  speed: number;
  maxSpeed: number;
  color: number;
  type: "car" | "taxi" | "truck" | "bus" | "motorcycle";
  /** accumulated crash damage, 0..1 — drives the visual dent/scorch */
  damage: number;
}

export const VEHICLE_STATS: Record<
  TrafficVehicle["type"],
  { hitRadius: number; speedMul: number; weight: number }
> = {
  motorcycle: { hitRadius: 2.2, speedMul: 1.35, weight: 5 },
  car: { hitRadius: 4.5, speedMul: 1, weight: 12 },
  taxi: { hitRadius: 4.5, speedMul: 1.05, weight: 4 },
  truck: { hitRadius: 5.5, speedMul: 0.75, weight: 3 },
  bus: { hitRadius: 6.5, speedMul: 0.55, weight: 2 },
};

function pickVehicleType(): TrafficVehicle["type"] {
  const entries = Object.entries(VEHICLE_STATS) as [
    TrafficVehicle["type"],
    (typeof VEHICLE_STATS)[TrafficVehicle["type"]],
  ][];
  const total = entries.reduce((s, [, v]) => s + v.weight, 0);
  let r = Math.random() * total;
  for (const [type, stats] of entries) {
    r -= stats.weight;
    if (r <= 0) return type;
  }
  return "car";
}

export class TrafficSystem {
  private scene: THREE.Scene;
  private nodes: TrafficNode[];
  private vehicles: TrafficVehicle[] = [];
  private maxVehicles: number = 32;
  private spawnTimer = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.nodes = generateTrafficNetwork(NUERNBERG_STREETS);
    console.log(`Traffic network: ${this.nodes.length} nodes`);
  }

  private distanceToNode(node: TrafficNode, point: THREE.Vector3) {
    return Math.hypot(node.position.x - point.x, node.position.z - point.z);
  }

  private pickNode(point?: THREE.Vector3, radius = 220, excludeId?: string) {
    const pool = point
      ? this.nodes.filter(
          (node) =>
            node.id !== excludeId && this.distanceToNode(node, point) <= radius,
        )
      : this.nodes.filter((node) => node.id !== excludeId);
    const candidates =
      pool.length > 0
        ? pool
        : this.nodes.filter((node) => node.id !== excludeId);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private buildPath(startNode: TrafficNode, point?: THREE.Vector3) {
    const destinationPool = this.nodes.filter(
      (node) => node.id !== startNode.id,
    );
    const nearby = point
      ? destinationPool.filter((node) => {
          const distance = this.distanceToNode(node, point);
          return distance > 60 && distance < 320;
        })
      : [];
    const endNode =
      nearby.length > 0
        ? nearby[Math.floor(Math.random() * nearby.length)]
        : destinationPool[Math.floor(Math.random() * destinationPool.length)];
    if (!endNode) return [];
    return findPath(this.nodes, startNode.id, endNode.id);
  }

  private routeVehicle(vehicle: TrafficVehicle, point?: THREE.Vector3) {
    const startNode = this.pickNode(
      point ??
        new THREE.Vector3(vehicle.mesh.position.x, 0, vehicle.mesh.position.z),
      240,
      vehicle.currentNode.id,
    );
    if (!startNode) return false;
    const path = this.buildPath(startNode, point);
    if (path.length < 2) return false;

    vehicle.currentNode = path[0];
    vehicle.targetNode = path[1];
    vehicle.path = path;
    vehicle.pathIndex = 0;
    vehicle.speed = Math.min(vehicle.speed, 0.05);
    return true;
  }

  spawnVehicle(playerPosition?: THREE.Vector3) {
    if (this.vehicles.length >= this.maxVehicles) return;
    if (this.nodes.length < 2) return;

    const startNode = this.pickNode(playerPosition, 260);
    if (!startNode) return;

    const path = this.buildPath(startNode, playerPosition);
    if (path.length < 2) return;

    const type = pickVehicleType();
    const mesh = this.createVehicleMesh(type);
    mesh.position.set(startNode.position.x, 0, startNode.position.z);
    this.scene.add(mesh);

    const vehicle: TrafficVehicle = {
      id: `traffic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mesh,
      currentNode: startNode,
      targetNode: path[1],
      path,
      pathIndex: 0,
      speed: 0,
      maxSpeed: (0.3 + Math.random() * 0.2) * VEHICLE_STATS[type].speedMul,
      color: Math.random() * 0xffffff,
      type,
      damage: 0,
    };

    this.vehicles.push(vehicle);
  }

  private wheels(
    group: THREE.Group,
    positions: number[][],
    radius: number,
    width: number,
  ) {
    const wheelGeo = new THREE.CylinderGeometry(radius, radius, width, 8);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    positions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
    });
  }

  private createVehicleMesh(type: TrafficVehicle["type"]): THREE.Group {
    const group = new THREE.Group();
    const colors = [
      0xff0000, 0x0000ff, 0x00aa00, 0xffcc00, 0xffffff, 0x333333, 0x666666,
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    if (type === "motorcycle") {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.7, 2.2),
        new THREE.MeshLambertMaterial({ color }),
      );
      body.position.y = 0.6;
      body.castShadow = true;
      group.add(body);
      const rider = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.28, 0.7, 4, 8),
        new THREE.MeshLambertMaterial({ color: 0x222222 }),
      );
      rider.position.set(0, 1.3, -0.1);
      group.add(rider);
      this.wheels(
        group,
        [
          [0, 0.4, 0.9],
          [0, 0.4, -0.9],
        ],
        0.4,
        0.25,
      );
      return group;
    }

    if (type === "truck") {
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2.2, 2.4),
        new THREE.MeshLambertMaterial({ color }),
      );
      cab.position.set(0, 1.5, 2.6);
      cab.castShadow = true;
      group.add(cab);
      const cargo = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 3, 6.5),
        new THREE.MeshLambertMaterial({ color: 0xdddddd }),
      );
      cargo.position.set(0, 2, -1.8);
      cargo.castShadow = true;
      group.add(cargo);
      this.wheels(
        group,
        [
          [-1.5, 0.6, 3],
          [1.5, 0.6, 3],
          [-1.5, 0.6, -1],
          [1.5, 0.6, -1],
          [-1.5, 0.6, -3.5],
          [1.5, 0.6, -3.5],
        ],
        0.6,
        0.5,
      );
      return group;
    }

    if (type === "bus") {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 3, 10),
        new THREE.MeshLambertMaterial({ color: 0xffcc00 }),
      );
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(3.25, 0.5, 10),
        new THREE.MeshLambertMaterial({ color: 0x222222 }),
      );
      stripe.position.y = 1.2;
      group.add(stripe);
      this.wheels(
        group,
        [
          [-1.6, 0.6, 3.5],
          [1.6, 0.6, 3.5],
          [-1.6, 0.6, -3.5],
          [1.6, 0.6, -3.5],
        ],
        0.6,
        0.45,
      );
      return group;
    }

    // car / taxi share a chassis; taxi gets the roof sign + livery
    const bodyColor = type === "taxi" ? 0xffd400 : color;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 6),
      new THREE.MeshLambertMaterial({ color: bodyColor }),
    );
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1, 3),
      new THREE.MeshLambertMaterial({
        color: type === "taxi" ? 0xffd400 : 0xcccccc,
      }),
    );
    roof.position.set(0, 2, -0.3);
    group.add(roof);

    if (type === "taxi") {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.35, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x222222 }),
      );
      sign.position.set(0, 2.7, -0.3);
      group.add(sign);
    }

    this.wheels(
      group,
      [
        [-1.3, 0.5, 1.8],
        [1.3, 0.5, 1.8],
        [-1.3, 0.5, -1.8],
        [1.3, 0.5, -1.8],
      ],
      0.5,
      0.4,
    );

    return group;
  }

  update(playerPosition: THREE.Vector3) {
    this.spawnTimer += 1;

    // Seed the city with some traffic right away, then keep a steady flow.
    const targetPopulation = Math.min(
      this.maxVehicles,
      14 + Math.floor(Math.max(0, 240 - playerPosition.length()) / 45),
    );

    while (this.vehicles.length < Math.min(6, targetPopulation)) {
      this.spawnVehicle(playerPosition);
    }

    const spawnEvery = this.vehicles.length < 10 ? 14 : 32;
    if (
      this.spawnTimer >= spawnEvery &&
      this.vehicles.length < targetPopulation
    ) {
      this.spawnVehicle(playerPosition);
      if (this.vehicles.length < targetPopulation && Math.random() < 0.6) {
        this.spawnVehicle(playerPosition);
      }
      this.spawnTimer = 0;
    }

    // Update each vehicle
    this.vehicles.forEach((vehicle, index) => {
      if (!vehicle.targetNode) {
        if (!this.routeVehicle(vehicle, playerPosition)) {
          this.removeVehicle(index);
        }
        return;
      }

      const target = new THREE.Vector3(
        vehicle.targetNode.position.x,
        0,
        vehicle.targetNode.position.z,
      );

      const current = vehicle.mesh.position.clone();
      const direction = target.clone().sub(current);
      const distance = direction.length();

      if (distance < 2) {
        // Reached node - move to next
        vehicle.pathIndex++;
        if (vehicle.pathIndex < vehicle.path.length) {
          vehicle.currentNode = vehicle.targetNode;
          vehicle.targetNode = vehicle.path[vehicle.pathIndex];
        } else {
          if (!this.routeVehicle(vehicle, playerPosition)) {
            vehicle.targetNode = null;
            this.removeVehicle(index);
            return;
          }
        }
      } else {
        // Move towards target
        direction.normalize();

        // Accelerate/decelerate
        vehicle.speed = Math.min(vehicle.speed + 0.01, vehicle.maxSpeed);

        // Check distance to player - slow down if close
        const distToPlayer = current.distanceTo(playerPosition);
        if (distToPlayer < 18) {
          vehicle.speed *= 0.8;
        }

        // Move
        vehicle.mesh.position.add(direction.multiplyScalar(vehicle.speed));

        // Rotate to face direction
        const angle = Math.atan2(direction.x, direction.z);
        vehicle.mesh.rotation.y = angle;
      }
    });

    // Keep traffic from stacking on itself at intersections.
    for (let i = 0; i < this.vehicles.length; i++) {
      for (let j = i + 1; j < this.vehicles.length; j++) {
        const a = this.vehicles[i];
        const b = this.vehicles[j];
        const dx = a.mesh.position.x - b.mesh.position.x;
        const dz = a.mesh.position.z - b.mesh.position.z;
        const distSq = dx * dx + dz * dz;
        const minDist = a.type === "bus" || b.type === "bus" ? 8 : 5.5;

        if (distSq > 0.001 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const push = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          a.mesh.position.x += nx * push;
          a.mesh.position.z += nz * push;
          b.mesh.position.x -= nx * push;
          b.mesh.position.z -= nz * push;
          a.speed *= 0.92;
          b.speed *= 0.92;
        }
      }
    }

    // Remove vehicles that are too far from player
    this.vehicles = this.vehicles.filter((v) => {
      const dist = v.mesh.position.distanceTo(playerPosition);
      if (dist > 300) {
        this.scene.remove(v.mesh);
        return false;
      }
      return true;
    });
  }

  private removeVehicle(index: number) {
    const vehicle = this.vehicles[index];
    if (vehicle) {
      this.scene.remove(vehicle.mesh);
      this.vehicles.splice(index, 1);
    }
  }

  claimVehicle(id: string): TrafficVehicle | null {
    const index = this.vehicles.findIndex((vehicle) => vehicle.id === id);
    if (index < 0) return null;
    const [vehicle] = this.vehicles.splice(index, 1);
    return vehicle ?? null;
  }

  getVehicles(): TrafficVehicle[] {
    return this.vehicles;
  }

  // Draw streets (call once during init)
  drawStreets(): THREE.Group {
    const streetsGroup = new THREE.Group();

    NUERNBERG_STREETS.forEach((street) => {
      const dx = street.end.x - street.start.x;
      const dz = street.end.z - street.start.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      // Asphalt
      const roadGeo = new THREE.PlaneGeometry(street.width, length);
      const roadMat = new THREE.MeshLambertMaterial({
        color:
          street.type === "main"
            ? 0x333333
            : street.type === "side"
              ? 0x444444
              : 0x555555,
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.rotation.z = angle;
      road.position.set(
        (street.start.x + street.end.x) / 2,
        0.05,
        (street.start.z + street.end.z) / 2,
      );
      road.receiveShadow = true;
      streetsGroup.add(road);

      // Narrow painted shoulders help the roads read from a distance.
      const shoulderColor =
        street.type === "main"
          ? 0xb0b0b0
          : street.type === "side"
            ? 0x9e9e9e
            : 0x8f8f8f;
      const shoulderMat = new THREE.MeshBasicMaterial({
        color: shoulderColor,
        transparent: true,
        opacity: 0.8,
      });
      [-1, 1].forEach((side) => {
        const shoulder = new THREE.Mesh(
          new THREE.PlaneGeometry(0.28, length),
          shoulderMat,
        );
        shoulder.rotation.x = -Math.PI / 2;
        shoulder.rotation.z = angle;
        const offset = side * (street.width / 2 - 0.35);
        const perpX = Math.cos(angle) * offset;
        const perpZ = -Math.sin(angle) * offset;
        shoulder.position.set(
          (street.start.x + street.end.x) / 2 + perpX,
          0.06,
          (street.start.z + street.end.z) / 2 + perpZ,
        );
        streetsGroup.add(shoulder);
      });

      // Center line (for main roads)
      if (street.type === "main") {
        const dashMat = new THREE.MeshBasicMaterial({
          color: 0xffe97a,
          transparent: true,
          opacity: 0.95,
        });
        for (let t = 0; t < length; t += 8) {
          const dashLen = Math.min(4, length - t);
          if (dashLen <= 0.5) continue;
          const dash = new THREE.Mesh(
            new THREE.PlaneGeometry(0.32, dashLen),
            dashMat,
          );
          dash.rotation.x = -Math.PI / 2;
          dash.rotation.z = angle;
          const centerT = t + dashLen / 2;
          const mx = street.start.x + (dx / length) * centerT;
          const mz = street.start.z + (dz / length) * centerT;
          dash.position.set(mx, 0.065, mz);
          streetsGroup.add(dash);
        }
      }
    });

    return streetsGroup;
  }
}

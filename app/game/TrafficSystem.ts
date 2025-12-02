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
  type: "car" | "truck" | "bus";
}

export class TrafficSystem {
  private scene: THREE.Scene;
  private nodes: TrafficNode[];
  private vehicles: TrafficVehicle[] = [];
  private maxVehicles: number = 15;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.nodes = generateTrafficNetwork(NUERNBERG_STREETS);
    console.log(`Traffic network: ${this.nodes.length} nodes`);
  }

  spawnVehicle() {
    if (this.vehicles.length >= this.maxVehicles) return;
    if (this.nodes.length < 2) return;

    // Pick random start node
    const startNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];

    // Pick random destination
    let endNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
    let attempts = 0;
    while (endNode.id === startNode.id && attempts < 10) {
      endNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
      attempts++;
    }

    // Find path
    const path = findPath(this.nodes, startNode.id, endNode.id);
    if (path.length < 2) return;

    // Create vehicle mesh
    const mesh = this.createVehicleMesh();
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
      maxSpeed: 0.3 + Math.random() * 0.2,
      color: Math.random() * 0xffffff,
      type: "car",
    };

    this.vehicles.push(vehicle);
  }

  private createVehicleMesh(): THREE.Group {
    const group = new THREE.Group();

    // Random car colors
    const colors = [
      0xff0000, 0x0000ff, 0x00aa00, 0xffcc00, 0xffffff, 0x333333, 0x666666,
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 6),
      new THREE.MeshLambertMaterial({ color }),
    );
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    // Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1, 3),
      new THREE.MeshLambertMaterial({ color: 0xcccccc }),
    );
    roof.position.set(0, 2, -0.3);
    group.add(roof);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    [
      [-1.3, 0.5, 1.8],
      [1.3, 0.5, 1.8],
      [-1.3, 0.5, -1.8],
      [1.3, 0.5, -1.8],
    ].forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
    });

    return group;
  }

  update(playerPosition: THREE.Vector3) {
    // Spawn new vehicles occasionally
    if (Math.random() < 0.01 && this.vehicles.length < this.maxVehicles) {
      this.spawnVehicle();
    }

    // Update each vehicle
    this.vehicles.forEach((vehicle, index) => {
      if (!vehicle.targetNode) {
        // Reached destination - remove or pick new path
        this.removeVehicle(index);
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
          vehicle.targetNode = null; // Reached end
        }
      } else {
        // Move towards target
        direction.normalize();

        // Accelerate/decelerate
        vehicle.speed = Math.min(vehicle.speed + 0.01, vehicle.maxSpeed);

        // Check distance to player - slow down if close
        const distToPlayer = current.distanceTo(playerPosition);
        if (distToPlayer < 15) {
          vehicle.speed *= 0.8;
        }

        // Move
        vehicle.mesh.position.add(direction.multiplyScalar(vehicle.speed));

        // Rotate to face direction
        const angle = Math.atan2(direction.x, direction.z);
        vehicle.mesh.rotation.y = angle;
      }
    });

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

      // Center line (for main roads)
      if (street.type === "main") {
        const lineGeo = new THREE.PlaneGeometry(0.3, length);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.rotation.z = angle;
        line.position.set(
          (street.start.x + street.end.x) / 2,
          0.06,
          (street.start.z + street.end.z) / 2,
        );
        streetsGroup.add(line);
      }
    });

    return streetsGroup;
  }
}

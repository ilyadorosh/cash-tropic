"use client";

import * as THREE from "three";

export interface BuildingConfig {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  type: "residential" | "commercial" | "industrial" | "power" | "research";
  energyConsumption: number;
  energyProduction: number;
}

export interface CivilizationGridOptions {
  gridSize?: number;
  cellSize?: number;
  buildings?: BuildingConfig[];
}

/**
 * CivilizationGrid visualizes an energy-based civilization
 *
 * Core concepts:
 * - Energy flows are the lifeblood of civilization
 * - Buildings consume and produce energy
 * - The grid shows energy balance and flow
 */
export class CivilizationGrid {
  private group: THREE.Group;
  private buildings: THREE.Group[] = [];
  private energyFlows: THREE.Line[] = [];
  private options: Required<CivilizationGridOptions>;
  private time: number = 0;

  constructor(scene: THREE.Scene, options: CivilizationGridOptions = {}) {
    this.options = {
      gridSize: options.gridSize ?? 10,
      cellSize: options.cellSize ?? 4,
      buildings: options.buildings ?? this.generateDefaultBuildings(),
    };

    this.group = new THREE.Group();
    scene.add(this.group);

    this.createGround();
    this.createBuildings();
    this.createEnergyNetwork();
  }

  private generateDefaultBuildings(): BuildingConfig[] {
    const buildings: BuildingConfig[] = [];
    const { gridSize } = this.options;

    // Power plant in center
    buildings.push({
      x: 0,
      z: 0,
      width: 3,
      depth: 3,
      height: 8,
      type: "power",
      energyConsumption: 0,
      energyProduction: 1000,
    });

    // Research facility
    buildings.push({
      x: -8,
      z: 4,
      width: 4,
      depth: 4,
      height: 12,
      type: "research",
      energyConsumption: 200,
      energyProduction: 0,
    });

    // Industrial buildings
    for (let i = 0; i < 3; i++) {
      buildings.push({
        x: 8 + i * 5,
        z: -6,
        width: 4,
        depth: 6,
        height: 6,
        type: "industrial",
        energyConsumption: 150,
        energyProduction: 0,
      });
    }

    // Commercial district
    for (let i = 0; i < 4; i++) {
      buildings.push({
        x: -6 + i * 4,
        z: -12,
        width: 3,
        depth: 3,
        height: 10 + Math.random() * 8,
        type: "commercial",
        energyConsumption: 100,
        energyProduction: 0,
      });
    }

    // Residential buildings
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 2; j++) {
        buildings.push({
          x: -15 + i * 5,
          z: 10 + j * 6,
          width: 3,
          depth: 4,
          height: 4 + Math.random() * 4,
          type: "residential",
          energyConsumption: 50,
          energyProduction: 0,
        });
      }
    }

    return buildings;
  }

  private getBuildingColor(type: BuildingConfig["type"]): number {
    const colors: Record<BuildingConfig["type"], number> = {
      residential: 0x88aa88,
      commercial: 0x8888cc,
      industrial: 0xaa8866,
      power: 0xff6600,
      research: 0x66ccff,
    };
    return colors[type];
  }

  private createGround(): void {
    const { gridSize, cellSize } = this.options;
    const size = gridSize * cellSize * 2;

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(size, size);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x1a1a2e,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Road grid
    const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x333344 });

    for (let i = -gridSize; i <= gridSize; i++) {
      // Horizontal roads
      const hRoadGeometry = new THREE.PlaneGeometry(size, 1);
      const hRoad = new THREE.Mesh(hRoadGeometry, roadMaterial);
      hRoad.rotation.x = -Math.PI / 2;
      hRoad.position.set(0, 0, i * cellSize);
      this.group.add(hRoad);

      // Vertical roads
      const vRoadGeometry = new THREE.PlaneGeometry(1, size);
      const vRoad = new THREE.Mesh(vRoadGeometry, roadMaterial);
      vRoad.rotation.x = -Math.PI / 2;
      vRoad.position.set(i * cellSize, 0, 0);
      this.group.add(vRoad);
    }
  }

  private createBuildings(): void {
    const { buildings } = this.options;

    for (const config of buildings) {
      const buildingGroup = new THREE.Group();

      // Main building body
      const bodyGeometry = new THREE.BoxGeometry(
        config.width,
        config.height,
        config.depth,
      );
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: this.getBuildingColor(config.type),
        transparent: config.type === "power",
        opacity: config.type === "power" ? 0.8 : 1,
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = config.height / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      buildingGroup.add(body);

      // Windows (small emissive boxes)
      if (config.height > 4) {
        const windowSize = 0.3;
        const windowsPerFloor = Math.floor(config.width / 1.5);
        const floors = Math.floor(config.height / 2);

        for (let floor = 0; floor < floors; floor++) {
          for (let w = 0; w < windowsPerFloor; w++) {
            const isLit = Math.random() > 0.3;
            const windowGeometry = new THREE.BoxGeometry(
              windowSize,
              windowSize,
              0.1,
            );
            const windowMaterial = new THREE.MeshBasicMaterial({
              color: isLit ? 0xffffaa : 0x333333,
            });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(
              -config.width / 2 + 0.5 + w * 1.5,
              1 + floor * 2,
              config.depth / 2 + 0.05,
            );
            buildingGroup.add(window);
          }
        }
      }

      // Power plant special effect
      if (config.type === "power") {
        const glowGeometry = new THREE.SphereGeometry(2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.5,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = config.height + 2;
        buildingGroup.add(glow);
        buildingGroup.userData.glow = glow;
      }

      // Research facility antenna
      if (config.type === "research") {
        const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4);
        const antennaMaterial = new THREE.MeshBasicMaterial({
          color: 0x888888,
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = config.height + 2;
        buildingGroup.add(antenna);

        const dishGeometry = new THREE.SphereGeometry(
          1,
          16,
          8,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2,
        );
        const dish = new THREE.Mesh(dishGeometry, antennaMaterial);
        dish.rotation.x = -Math.PI / 2;
        dish.position.y = config.height + 4;
        buildingGroup.add(dish);
      }

      buildingGroup.position.set(config.x, 0, config.z);
      buildingGroup.userData.config = config;
      this.group.add(buildingGroup);
      this.buildings.push(buildingGroup);
    }
  }

  private createEnergyNetwork(): void {
    const powerPlants = this.buildings.filter(
      (b) => b.userData.config?.type === "power",
    );
    const consumers = this.buildings.filter(
      (b) => b.userData.config?.type !== "power",
    );

    // Create energy flow lines from power plants to buildings
    for (const plant of powerPlants) {
      for (const consumer of consumers) {
        const plantPos = plant.position.clone();
        plantPos.y = plant.userData.config.height;

        const consumerPos = consumer.position.clone();
        consumerPos.y = consumer.userData.config.height / 2;

        // Create a curved path for energy flow
        const midPoint = plantPos.clone().add(consumerPos).multiplyScalar(0.5);
        midPoint.y = Math.max(plantPos.y, consumerPos.y) + 5;

        const curve = new THREE.QuadraticBezierCurve3(
          plantPos,
          midPoint,
          consumerPos,
        );
        const points = curve.getPoints(20);

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0xff8800,
          transparent: true,
          opacity: 0.3,
        });

        const line = new THREE.Line(geometry, material);
        this.group.add(line);
        this.energyFlows.push(line);
      }
    }
  }

  update(delta: number): void {
    this.time += delta;

    // Animate power plant glow
    for (const building of this.buildings) {
      if (
        building.userData.config?.type === "power" &&
        building.userData.glow
      ) {
        const glow = building.userData.glow as THREE.Mesh;
        const scale = 1 + Math.sin(this.time * 3) * 0.2;
        glow.scale.setScalar(scale);

        const material = glow.material as THREE.MeshBasicMaterial;
        material.opacity = 0.4 + Math.sin(this.time * 2) * 0.2;
      }
    }

    // Animate energy flow lines
    for (let i = 0; i < this.energyFlows.length; i++) {
      const line = this.energyFlows[i];
      const material = line.material as THREE.LineBasicMaterial;
      const phase = this.time * 2 + i * 0.1;
      material.opacity = 0.2 + Math.sin(phase) * 0.15;
    }
  }

  /**
   * Calculate total energy balance of the civilization
   */
  getEnergyBalance(): {
    production: number;
    consumption: number;
    balance: number;
  } {
    let production = 0;
    let consumption = 0;

    for (const building of this.buildings) {
      const config = building.userData.config as BuildingConfig;
      production += config.energyProduction;
      consumption += config.energyConsumption;
    }

    return {
      production,
      consumption,
      balance: production - consumption,
    };
  }

  dispose(): void {
    this.buildings.forEach((building) => {
      building.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    });

    this.energyFlows.forEach((line) => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });

    this.group.clear();
  }
}

export default CivilizationGrid;

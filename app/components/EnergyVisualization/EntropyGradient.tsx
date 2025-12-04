"use client";

import * as THREE from "three";

export interface EntropyGradientOptions {
  gridSize?: number;
  cellSize?: number;
  minTemperature?: number;
  maxTemperature?: number;
  updateRate?: number;
}

export interface HeatCell {
  temperature: number;
  mesh: THREE.Mesh;
}

/**
 * EntropyGradient visualizes temperature/entropy as a heat map grid
 *
 * Core physics concept:
 * - Temperature is a statistical measure of average kinetic energy
 * - Entropy (S = k_B ln Ω) measures the number of microstates
 * - Heat flows from hot to cold (second law of thermodynamics)
 */
export class EntropyGradient {
  private cells: HeatCell[][] = [];
  private group: THREE.Group;
  private options: Required<EntropyGradientOptions>;
  private time: number = 0;
  private heatSources: { x: number; z: number; intensity: number }[] = [];

  constructor(scene: THREE.Scene, options: EntropyGradientOptions = {}) {
    this.options = {
      gridSize: options.gridSize ?? 20,
      cellSize: options.cellSize ?? 2,
      minTemperature: options.minTemperature ?? 0,
      maxTemperature: options.maxTemperature ?? 100,
      updateRate: options.updateRate ?? 0.1,
    };

    this.group = new THREE.Group();
    this.group.position.y = 0.1; // Slightly above ground
    scene.add(this.group);

    this.createGrid();

    // Add some default heat sources
    this.addHeatSource(0, 0, 100);
  }

  private createGrid(): void {
    const { gridSize, cellSize } = this.options;
    const halfSize = (gridSize * cellSize) / 2;

    for (let x = 0; x < gridSize; x++) {
      this.cells[x] = [];
      for (let z = 0; z < gridSize; z++) {
        const geometry = new THREE.PlaneGeometry(
          cellSize * 0.95,
          cellSize * 0.95,
        );
        const material = new THREE.MeshBasicMaterial({
          color: this.getTemperatureColor(0),
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(
          x * cellSize - halfSize + cellSize / 2,
          0,
          z * cellSize - halfSize + cellSize / 2,
        );

        this.group.add(mesh);
        this.cells[x][z] = {
          temperature: this.options.minTemperature,
          mesh,
        };
      }
    }
  }

  private getTemperatureColor(temperature: number): THREE.Color {
    // Normalize temperature to 0-1 range
    const t = Math.max(
      0,
      Math.min(
        1,
        (temperature - this.options.minTemperature) /
          (this.options.maxTemperature - this.options.minTemperature),
      ),
    );

    // Color gradient: blue (cold) -> cyan -> green -> yellow -> red (hot)
    const color = new THREE.Color();

    if (t < 0.25) {
      // Blue to Cyan
      color.setRGB(0, t * 4, 1);
    } else if (t < 0.5) {
      // Cyan to Green
      color.setRGB(0, 1, 1 - (t - 0.25) * 4);
    } else if (t < 0.75) {
      // Green to Yellow
      color.setRGB((t - 0.5) * 4, 1, 0);
    } else {
      // Yellow to Red
      color.setRGB(1, 1 - (t - 0.75) * 4, 0);
    }

    return color;
  }

  addHeatSource(x: number, z: number, intensity: number): void {
    this.heatSources.push({ x, z, intensity });
  }

  removeHeatSource(index: number): void {
    this.heatSources.splice(index, 1);
  }

  clearHeatSources(): void {
    this.heatSources = [];
  }

  update(delta: number): void {
    this.time += delta;
    const { gridSize, cellSize, updateRate } = this.options;
    const halfSize = (gridSize * cellSize) / 2;

    // Apply heat sources
    for (const source of this.heatSources) {
      const gridX = Math.floor((source.x + halfSize) / cellSize);
      const gridZ = Math.floor((source.z + halfSize) / cellSize);

      for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
          const dx = x - gridX;
          const dz = z - gridZ;
          const distance = Math.sqrt(dx * dx + dz * dz);

          // Heat intensity decreases with distance (inverse square law)
          const heatContribution =
            source.intensity / (1 + distance * distance * 0.5);
          this.cells[x][z].temperature += heatContribution * delta * updateRate;
        }
      }
    }

    // Heat diffusion (Fourier's law: heat flows from hot to cold)
    const newTemps: number[][] = [];
    for (let x = 0; x < gridSize; x++) {
      newTemps[x] = [];
      for (let z = 0; z < gridSize; z++) {
        let avgNeighborTemp = 0;
        let neighborCount = 0;

        // Check 4 neighbors
        const neighbors = [
          [x - 1, z],
          [x + 1, z],
          [x, z - 1],
          [x, z + 1],
        ];

        for (const [nx, nz] of neighbors) {
          if (nx >= 0 && nx < gridSize && nz >= 0 && nz < gridSize) {
            avgNeighborTemp += this.cells[nx][nz].temperature;
            neighborCount++;
          }
        }

        if (neighborCount > 0) {
          avgNeighborTemp /= neighborCount;
          const currentTemp = this.cells[x][z].temperature;
          // Diffusion: temperature moves toward neighbor average
          newTemps[x][z] =
            currentTemp +
            (avgNeighborTemp - currentTemp) * delta * updateRate * 2;
        } else {
          newTemps[x][z] = this.cells[x][z].temperature;
        }

        // Cooling toward ambient (entropy production, heat dissipation)
        newTemps[x][z] *= 1 - delta * updateRate * 0.1;
      }
    }

    // Apply new temperatures and update colors
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        this.cells[x][z].temperature = Math.max(
          this.options.minTemperature,
          Math.min(this.options.maxTemperature, newTemps[x][z]),
        );

        const material = this.cells[x][z].mesh
          .material as THREE.MeshBasicMaterial;
        material.color = this.getTemperatureColor(this.cells[x][z].temperature);
      }
    }
  }

  /**
   * Get total entropy of the system
   * S = k_B * ln(Ω) - but we simplify to temperature-based entropy
   */
  getTotalEntropy(): number {
    let totalEntropy = 0;
    const { gridSize } = this.options;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        // Simplified entropy: S ~ ln(T) for an ideal gas
        const T = Math.max(1, this.cells[x][z].temperature);
        totalEntropy += Math.log(T);
      }
    }

    return totalEntropy;
  }

  dispose(): void {
    for (let x = 0; x < this.cells.length; x++) {
      for (let z = 0; z < this.cells[x].length; z++) {
        this.cells[x][z].mesh.geometry.dispose();
        (this.cells[x][z].mesh.material as THREE.Material).dispose();
      }
    }
    this.group.clear();
  }
}

export default EntropyGradient;

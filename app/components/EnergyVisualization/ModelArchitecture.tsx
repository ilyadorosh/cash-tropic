"use client";

import * as THREE from "three";

export interface LayerConfig {
  name: string;
  type:
    | "input"
    | "hidden"
    | "output"
    | "attention"
    | "embedding"
    | "normalization";
  size: number;
  color?: number;
}

export interface ModelArchitectureOptions {
  layers: LayerConfig[];
  spacing?: number;
  nodeSize?: number;
  animate?: boolean;
}

/**
 * ModelArchitecture visualizes neural network / transformer architectures in 3D
 *
 * Demonstrates:
 * - Layer structure of deep learning models
 * - Information flow through networks
 * - Attention mechanisms as connections
 */
export class ModelArchitecture {
  private group: THREE.Group;
  private layers: THREE.Group[] = [];
  private connections: THREE.Line[] = [];
  private options: Required<ModelArchitectureOptions>;
  private time: number = 0;
  private pulsePhase: number = 0;

  constructor(scene: THREE.Scene, options: ModelArchitectureOptions) {
    this.options = {
      layers: options.layers,
      spacing: options.spacing ?? 8,
      nodeSize: options.nodeSize ?? 0.5,
      animate: options.animate ?? true,
    };

    this.group = new THREE.Group();
    this.group.position.set(0, 15, 0);
    scene.add(this.group);

    this.buildArchitecture();
  }

  private getLayerColor(type: LayerConfig["type"]): number {
    const colors: Record<LayerConfig["type"], number> = {
      input: 0x00ff88,
      hidden: 0x4488ff,
      output: 0xff4488,
      attention: 0xffaa00,
      embedding: 0x88ff44,
      normalization: 0xff88ff,
    };
    return colors[type];
  }

  private buildArchitecture(): void {
    const { layers, spacing, nodeSize } = this.options;
    const totalWidth = (layers.length - 1) * spacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerGroup = new THREE.Group();
      const x = startX + i * spacing;

      // Calculate node positions for this layer
      const nodeCount = Math.min(layer.size, 10); // Limit visual nodes
      const nodeSpacing = nodeSize * 2.5;
      const layerHeight = (nodeCount - 1) * nodeSpacing;
      const startY = -layerHeight / 2;

      // Create nodes for this layer
      for (let j = 0; j < nodeCount; j++) {
        const y = startY + j * nodeSpacing;

        // Create node sphere
        const geometry = new THREE.SphereGeometry(nodeSize, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: layer.color ?? this.getLayerColor(layer.type),
          emissive: layer.color ?? this.getLayerColor(layer.type),
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.9,
        });

        const node = new THREE.Mesh(geometry, material);
        node.position.set(0, y, 0);
        node.userData = { layerIndex: i, nodeIndex: j };
        layerGroup.add(node);
      }

      // Add layer label
      // (In a real implementation, you'd use TextGeometry or sprites)
      // For now, add a small indicator box
      const labelGeometry = new THREE.BoxGeometry(spacing * 0.8, 0.3, 0.1);
      const labelMaterial = new THREE.MeshBasicMaterial({
        color: this.getLayerColor(layer.type),
        transparent: true,
        opacity: 0.5,
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(0, -layerHeight / 2 - 2, 0);
      layerGroup.add(label);

      layerGroup.position.set(x, 0, 0);
      this.group.add(layerGroup);
      this.layers.push(layerGroup);

      // Create connections to previous layer
      if (i > 0) {
        this.createConnections(i - 1, i);
      }
    }
  }

  private createConnections(
    fromLayerIndex: number,
    toLayerIndex: number,
  ): void {
    const fromLayer = this.layers[fromLayerIndex];
    const toLayer = this.layers[toLayerIndex];

    const fromNodes = fromLayer.children.filter(
      (child) =>
        child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.SphereGeometry,
    );
    const toNodes = toLayer.children.filter(
      (child) =>
        child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.SphereGeometry,
    );

    // Create connections (limit for performance)
    const maxConnections = 50;
    let connectionCount = 0;

    for (
      let i = 0;
      i < fromNodes.length && connectionCount < maxConnections;
      i++
    ) {
      for (
        let j = 0;
        j < toNodes.length && connectionCount < maxConnections;
        j++
      ) {
        // Probabilistic connection for visual clarity
        if (Math.random() > 0.3) continue;

        const fromNode = fromNodes[i] as THREE.Mesh;
        const toNode = toNodes[j] as THREE.Mesh;

        const fromPos = new THREE.Vector3();
        const toPos = new THREE.Vector3();

        fromNode.getWorldPosition(fromPos);
        toNode.getWorldPosition(toPos);

        const points = [fromPos, toPos];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
          color: 0x4466aa,
          transparent: true,
          opacity: 0.15,
        });

        const line = new THREE.Line(geometry, material);
        this.group.add(line);
        this.connections.push(line);
        connectionCount++;
      }
    }
  }

  update(delta: number): void {
    if (!this.options.animate) return;

    this.time += delta;
    this.pulsePhase += delta * 2;

    // Animate data flow through the network
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const phaseOffset = i * 0.5;
      const pulse = Math.sin(this.pulsePhase - phaseOffset);

      layer.children.forEach((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.geometry instanceof THREE.SphereGeometry
        ) {
          const material = child.material as THREE.MeshPhongMaterial;
          material.emissiveIntensity = 0.3 + pulse * 0.2;

          // Slight scale pulse
          const scale = 1 + pulse * 0.1;
          child.scale.setScalar(scale);
        }
      });
    }

    // Animate connections
    const connectionPulse = (Math.sin(this.pulsePhase * 0.5) + 1) / 2;
    this.connections.forEach((line, index) => {
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = 0.1 + connectionPulse * 0.15;
    });
  }

  setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }

  setRotation(y: number): void {
    this.group.rotation.y = y;
  }

  dispose(): void {
    this.layers.forEach((layer) => {
      layer.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    });

    this.connections.forEach((line) => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });

    this.group.clear();
  }
}

// Preset architectures
export const PRESET_ARCHITECTURES = {
  transformer: {
    layers: [
      { name: "Input Embedding", type: "embedding" as const, size: 512 },
      { name: "Attention 1", type: "attention" as const, size: 512 },
      { name: "LayerNorm 1", type: "normalization" as const, size: 512 },
      { name: "Attention 2", type: "attention" as const, size: 512 },
      { name: "LayerNorm 2", type: "normalization" as const, size: 512 },
      { name: "Output", type: "output" as const, size: 512 },
    ],
  },
  mlp: {
    layers: [
      { name: "Input", type: "input" as const, size: 128 },
      { name: "Hidden 1", type: "hidden" as const, size: 256 },
      { name: "Hidden 2", type: "hidden" as const, size: 128 },
      { name: "Hidden 3", type: "hidden" as const, size: 64 },
      { name: "Output", type: "output" as const, size: 10 },
    ],
  },
  custom: {
    layers: [
      {
        name: "Energy Input",
        type: "input" as const,
        size: 256,
        color: 0xff6600,
      },
      { name: "Thermodynamic Encoder", type: "embedding" as const, size: 512 },
      { name: "Entropy Layer", type: "attention" as const, size: 512 },
      { name: "Boltzmann Sampler", type: "hidden" as const, size: 256 },
      { name: "Statistical Output", type: "output" as const, size: 128 },
    ],
  },
};

export default ModelArchitecture;

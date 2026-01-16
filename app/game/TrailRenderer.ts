// TrailRenderer.ts - Visualize player movement trails in 3D

import * as THREE from "three";
import { PlayerTrailPoint } from "./RedisMapLoader";

export interface TrailConfig {
  color: number;
  opacity: number;
  width: number;
  maxPoints: number;
  fadeTime: number; // milliseconds
}

export class TrailRenderer {
  private scene: THREE.Scene;
  private trails: Map<string, THREE.Line> = new Map();
  private trailPoints: Map<string, PlayerTrailPoint[]> = new Map();
  private config: TrailConfig;
  private playerColors: Map<string, number> = new Map(); // Per-player colors

  constructor(scene: THREE.Scene, config?: Partial<TrailConfig>) {
    this.scene = scene;
    this.config = {
      color: 0x00ff88,
      opacity: 0.6,
      width: 2,
      maxPoints: 500,
      fadeTime: 300000, // 5 minutes
      ...config,
    };
  }

  /**
   * Add a trail point for a player
   */
  addPoint(playerId: string, x: number, z: number, action?: string) {
    const point: PlayerTrailPoint = {
      x,
      z,
      timestamp: Date.now(),
      playerId,
      action,
    };

    if (!this.trailPoints.has(playerId)) {
      this.trailPoints.set(playerId, []);
    }

    const points = this.trailPoints.get(playerId)!;
    points.push(point);

    // Keep only recent points
    const cutoffTime = Date.now() - this.config.fadeTime;
    const recentPoints = points.filter((p) => p.timestamp > cutoffTime);
    this.trailPoints.set(playerId, recentPoints.slice(-this.config.maxPoints));

    this.updateTrailMesh(playerId);
  }

  /**
   * Load trails from external data
   */
  loadTrails(trails: Map<string, PlayerTrailPoint[]>) {
    trails.forEach((points, playerId) => {
      this.trailPoints.set(playerId, points);
      this.updateTrailMesh(playerId);
    });
  }

  /**
   * Update the visual trail mesh for a player
   */
  private updateTrailMesh(playerId: string) {
    const points = this.trailPoints.get(playerId);
    if (!points || points.length < 2) return;

    // Remove old trail if exists
    const oldTrail = this.trails.get(playerId);
    if (oldTrail) {
      this.scene.remove(oldTrail);
      oldTrail.geometry.dispose();
      (oldTrail.material as THREE.Material).dispose();
    }

    // Create new trail geometry
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const now = Date.now();

    points.forEach((point, index) => {
      // Position
      positions.push(point.x, 0.1, point.z); // Slightly above ground

      // Color with fade based on age
      const age = now - point.timestamp;
      const fadeProgress = Math.min(age / this.config.fadeTime, 1);
      const opacity = this.config.opacity * (1 - fadeProgress * 0.7);

      // Use player-specific color or default
      const playerColor = this.playerColors.get(playerId) || this.config.color;
      const color = new THREE.Color(playerColor);
      colors.push(color.r * opacity, color.g * opacity, color.b * opacity);
    });

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    // Create material
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: this.config.width,
      transparent: true,
      opacity: this.config.opacity,
    });

    // Create line
    const line = new THREE.Line(geometry, material);
    line.userData = { type: "player_trail", playerId };

    this.scene.add(line);
    this.trails.set(playerId, line);
  }

  /**
   * Update trails (fade old points)
   */
  update() {
    const cutoffTime = Date.now() - this.config.fadeTime;

    this.trailPoints.forEach((points, playerId) => {
      const recentPoints = points.filter((p) => p.timestamp > cutoffTime);

      if (recentPoints.length !== points.length) {
        this.trailPoints.set(playerId, recentPoints);
        this.updateTrailMesh(playerId);
      }

      if (recentPoints.length === 0) {
        this.removeTrail(playerId);
      }
    });
  }

  /**
   * Remove a trail
   */
  removeTrail(playerId: string) {
    const trail = this.trails.get(playerId);
    if (trail) {
      this.scene.remove(trail);
      trail.geometry.dispose();
      (trail.material as THREE.Material).dispose();
      this.trails.delete(playerId);
    }
    this.trailPoints.delete(playerId);
  }

  /**
   * Clear all trails
   */
  clearAll() {
    this.trails.forEach((trail) => {
      this.scene.remove(trail);
      trail.geometry.dispose();
      (trail.material as THREE.Material).dispose();
    });
    this.trails.clear();
    this.trailPoints.clear();
  }

  /**
   * Get current trail points for a player
   */
  getTrailPoints(playerId: string): PlayerTrailPoint[] {
    return this.trailPoints.get(playerId) || [];
  }

  /**
   * Render special markers for important actions
   */
  addActionMarker(x: number, z: number, action: string) {
    const markerMap: Record<string, number> = {
      collected_computer: 0x3498db,
      mined_data: 0x9b59b6,
      purchased_luxury: 0xf39c12,
    };

    const color = markerMap[action] || 0xffffff;

    // Create a glowing marker
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(x, 1, z);
    marker.userData = { type: "action_marker", action, timestamp: Date.now() };

    this.scene.add(marker);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      this.scene.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
    }, 10000);
  }

  /**
   * Set trail color for a specific player
   */
  setColor(playerId: string, color: number) {
    this.playerColors.set(playerId, color);
    const points = this.trailPoints.get(playerId);
    if (points) {
      this.updateTrailMesh(playerId);
    }
  }
}

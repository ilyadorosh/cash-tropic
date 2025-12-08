"use client";

import * as THREE from "three";

export interface EnergyParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  energy: number;
  lifetime: number;
  maxLifetime: number;
}

export interface EnergyParticleSystemOptions {
  particleCount?: number;
  particleSize?: number;
  energyColor?: THREE.Color;
  lowEnergyColor?: THREE.Color;
  emitterPosition?: THREE.Vector3;
  emitterRadius?: number;
  initialEnergy?: number;
  energyDecay?: number;
}

export class EnergyParticleSystem {
  private particles: EnergyParticle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private options: Required<EnergyParticleSystemOptions>;

  constructor(scene: THREE.Scene, options: EnergyParticleSystemOptions = {}) {
    this.options = {
      particleCount: options.particleCount ?? 1000,
      particleSize: options.particleSize ?? 0.3,
      energyColor: options.energyColor ?? new THREE.Color(0xff6600),
      lowEnergyColor: options.lowEnergyColor ?? new THREE.Color(0x0066ff),
      emitterPosition: options.emitterPosition ?? new THREE.Vector3(0, 10, 0),
      emitterRadius: options.emitterRadius ?? 5,
      initialEnergy: options.initialEnergy ?? 1.0,
      energyDecay: options.energyDecay ?? 0.01,
    };

    // Initialize particles
    for (let i = 0; i < this.options.particleCount; i++) {
      this.particles.push(this.createParticle());
    }

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.options.particleCount * 3);
    const colors = new Float32Array(this.options.particleCount * 3);
    const sizes = new Float32Array(this.options.particleCount);

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Create material with custom shader for varying sizes
    this.material = new THREE.PointsMaterial({
      size: this.options.particleSize,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Create points mesh
    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);

    this.updateGeometry();
  }

  private createParticle(): EnergyParticle {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = Math.random() * this.options.emitterRadius;

    const position = new THREE.Vector3(
      this.options.emitterPosition.x + r * Math.sin(phi) * Math.cos(theta),
      this.options.emitterPosition.y + r * Math.sin(phi) * Math.sin(theta),
      this.options.emitterPosition.z + r * Math.cos(phi),
    );

    // Velocity influenced by energy (higher energy = faster)
    const speed = 0.5 + Math.random() * 0.5;
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * speed,
      (Math.random() - 0.5) * speed - 0.1, // Slight downward bias
      (Math.random() - 0.5) * speed,
    );

    return {
      position,
      velocity,
      energy: this.options.initialEnergy,
      lifetime: 0,
      maxLifetime: 100 + Math.random() * 200,
    };
  }

  private updateGeometry(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const i3 = i * 3;

      positions[i3] = particle.position.x;
      positions[i3 + 1] = particle.position.y;
      positions[i3 + 2] = particle.position.z;

      // Interpolate color based on energy (high = orange/red, low = blue)
      const color = new THREE.Color().lerpColors(
        this.options.lowEnergyColor,
        this.options.energyColor,
        particle.energy,
      );

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  update(delta: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      // Update position
      particle.position.add(
        particle.velocity.clone().multiplyScalar(delta * 60),
      );

      // Energy decay (entropy increases, usable energy decreases)
      particle.energy = Math.max(
        0,
        particle.energy - this.options.energyDecay * delta,
      );

      // Velocity slows as energy decreases (thermodynamic equilibrium)
      particle.velocity.multiplyScalar(0.99);

      // Update lifetime
      particle.lifetime += delta * 60;

      // Respawn if dead or too low energy
      if (particle.lifetime > particle.maxLifetime || particle.energy < 0.01) {
        this.particles[i] = this.createParticle();
      }

      // Boundary check - wrap around or respawn
      if (particle.position.y < -10) {
        this.particles[i] = this.createParticle();
      }
    }

    this.updateGeometry();
  }

  setEmitterPosition(position: THREE.Vector3): void {
    this.options.emitterPosition = position;
  }

  setEnergyColor(color: THREE.Color): void {
    this.options.energyColor = color;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export default EnergyParticleSystem;

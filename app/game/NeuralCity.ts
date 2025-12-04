import * as THREE from "three";

// Simplified Matrix Building - no async, no TensorFlow dependency issues
class SimpleMatrixBuilding {
  public group: THREE.Group;
  private material: THREE.ShaderMaterial;
  private wireframe: THREE.LineSegments;

  constructor(width: number, height: number, depth: number) {
    this.group = new THREE.Group();

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glitch: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float glitch;
        varying vec2 vUv;
        varying vec3 vPos;
        
        float random(vec2 st) {
          return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          // Matrix rain
          float col = floor(vUv.x * 20.0);
          float speed = random(vec2(col, 0.0)) * 2.0 + 1.0;
          float rain = step(0.95, random(vec2(col, floor(time * speed))));
          float trail = fract(time * speed - vUv.y * 2.0);
          trail = smoothstep(0.0, 0.5, trail) * smoothstep(1.0, 0.5, trail);
          
          // Grid pattern
          float gridX = step(0.95, fract(vUv.x * 20.0));
          float gridY = step(0.95, fract(vUv.y * 30.0));
          float grid = max(gridX, gridY) * 0.3;
          
          // Cellular automata-like noise
          float cell = step(0.7, random(floor(vUv * 10.0) + floor(time * 0.5)));
          
          vec3 color = vec3(0.0, 0.8, 0.2); // Matrix green
          float alpha = rain * trail + grid + cell * 0.2;
          
          // Glitch
          if (glitch > 0.0) {
            color. r += random(vUv + time) * glitch;
            alpha += glitch * 0.5;
          }
          
          gl_FragColor = vec4(color, alpha * 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.position.y = height / 2;
    this.group.add(mesh);

    // Wireframe
    const wireGeo = new THREE.EdgesGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
    });
    this.wireframe = new THREE.LineSegments(wireGeo, wireMat);
    this.wireframe.position.y = height / 2;
    this.group.add(this.wireframe);
  }

  update(dt: number) {
    this.material.uniforms.time.value += dt;

    // Random glitch
    if (Math.random() < 0.005) {
      this.material.uniforms.glitch.value = 0.5;
    }
    this.material.uniforms.glitch.value *= 0.9;
  }

  dispose() {
    this.material.dispose();
  }
}

export class NeuralCity {
  private buildings: SimpleMatrixBuilding[] = [];
  private scene: THREE.Scene;
  private matrixMode: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createBuildings(); // Create immediately!
  }

  private createBuildings() {
    const locations = [
      // Südstadt
      { x: -70, z: 175, w: 15, h: 25, d: 12 },
      { x: -95, z: 190, w: 12, h: 20, d: 10 },
      { x: 70, z: 175, w: 15, h: 30, d: 12 },
      { x: 95, z: 190, w: 12, h: 22, d: 10 },
      { x: -70, z: 250, w: 15, h: 28, d: 12 },
      { x: 70, z: 250, w: 15, h: 24, d: 12 },
      { x: 0, z: 280, w: 20, h: 35, d: 15 },

      // Innenstadt
      { x: -60, z: -60, w: 20, h: 45, d: 15 },
      { x: -30, z: -60, w: 18, h: 50, d: 15 },
      { x: 30, z: -60, w: 18, h: 55, d: 15 },
      { x: 60, z: -60, w: 20, h: 40, d: 15 },
      { x: 0, z: -30, w: 25, h: 60, d: 20 },
      { x: -80, z: -100, w: 15, h: 35, d: 12 },
      { x: 80, z: -100, w: 15, h: 35, d: 12 },

      // Autobahn
      { x: -50, z: -200, w: 30, h: 20, d: 40 },
      { x: 50, z: -200, w: 30, h: 25, d: 40 },
      { x: 0, z: -300, w: 40, h: 15, d: 60 },

      // Gostenhof
      { x: -200, z: 100, w: 18, h: 28, d: 14 },
      { x: -250, z: 150, w: 16, h: 24, d: 12 },
      { x: -220, z: 200, w: 20, h: 32, d: 16 },

      // Erlenstegen
      { x: 250, z: 0, w: 22, h: 40, d: 18 },
      { x: 300, z: 50, w: 25, h: 45, d: 20 },
      { x: 280, z: -50, w: 20, h: 38, d: 16 },

      // Hafen
      { x: -300, z: -150, w: 35, h: 18, d: 50 },
      { x: -350, z: -200, w: 40, h: 22, d: 45 },
    ];

    locations.forEach((loc) => {
      const building = new SimpleMatrixBuilding(loc.w, loc.h, loc.d);
      building.group.position.set(loc.x, 0, loc.z);
      building.group.visible = false; // Hidden until matrix mode
      this.scene.add(building.group);
      this.buildings.push(building);
    });

    console.log(`NeuralCity: Created ${this.buildings.length} buildings`);
  }

  update(deltaTime: number, playerPosition: THREE.Vector3) {
    if (!this.matrixMode) return;

    this.buildings.forEach((building) => {
      const dist = playerPosition.distanceTo(building.group.position);
      if (dist < 200) {
        building.update(deltaTime);
      }
    });
  }

  toggleMatrixMode(): boolean {
    this.matrixMode = !this.matrixMode;
    this.buildings.forEach((b) => {
      b.group.visible = this.matrixMode;
    });
    console.log(
      `Matrix mode: ${this.matrixMode}, buildings: ${this.buildings.length}`,
    );
    return this.matrixMode;
  }

  isMatrixModeActive(): boolean {
    return this.matrixMode;
  }

  getBuildingCount(): number {
    return this.buildings.length;
  }

  dispose() {
    this.buildings.forEach((b) => {
      this.scene.remove(b.group);
      b.dispose();
    });
    this.buildings = [];
  }
}

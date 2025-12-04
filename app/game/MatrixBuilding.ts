import * as THREE from "three";
import { TemporalNCA } from "./NeuralBuildings"; // Changed import!

export class MatrixBuilding {
  public group: THREE.Group;
  private nca: TemporalNCA; // Changed type!
  private ncaTexture: THREE.DataTexture | null = null;
  private ncaMaterial: THREE.ShaderMaterial;
  private wireframeMesh: THREE.LineSegments;
  private solidMesh: THREE.Mesh;
  private glitchTime: number = 0;
  private isGlitching: boolean = false;
  private timeWarp: number = 1; // 0 = past, 1 = present

  constructor(width: number, height: number, depth: number) {
    this.group = new THREE.Group();
    this.nca = new TemporalNCA(64, 64); // Using Temporal version!

    // ... rest of constructor stays same ...

    // Create shader material for NCA + Matrix effect
    this.ncaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ncaTexture: { value: null },
        time: { value: 0 },
        glitch: { value: 0 },
        timeWarp: { value: 1 }, // ADD THIS
        matrixColor: { value: new THREE.Color(0x00ff00) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D ncaTexture;
        uniform float time;
        uniform float glitch;
        uniform float timeWarp;
        uniform vec3 matrixColor;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec4 nca = texture2D(ncaTexture, vUv);
          
          // Matrix rain
          float col = floor(vUv.x * 30.0);
          float rain = step(0.98, random(vec2(col, floor(time * 5.0 + col * 0.1))));
          float trail = smoothstep(0.0, 1.0, fract(time * 2.0 + col * 0.1 - vUv.y));
          
          // Time warp color shift (blue = past, green = present)
          vec3 warpColor = mix(vec3(0.0, 0.5, 1.0), matrixColor, timeWarp);
          
          vec3 ncaColor = nca.rgb * warpColor;
          vec3 rainColor = warpColor * rain * trail * 2.0;
          
          // Glitch
          vec3 color = ncaColor + rainColor;
          color += glitch * vec3(random(vUv + time), 0.0, random(vUv - time)) * 0.5;
          
          // Time warp distortion
          float warpDistort = (1.0 - timeWarp) * sin(vPosition.y * 20.0 + time * 10.0) * 0.05;
          color += warpDistort;
          
          // Scanlines
          float scanline = sin(vUv.y * 500.0) * 0.1;
          color -= scanline;
          
          float alpha = max(nca.a * 0.8, rain * trail);
          alpha = max(alpha, 0.1);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.BoxGeometry(width, height, depth);
    this.solidMesh = new THREE.Mesh(geometry, this.ncaMaterial);
    this.solidMesh.position.y = height / 2;
    this.group.add(this.solidMesh);

    const wireframeGeo = new THREE.EdgesGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
    });
    this.wireframeMesh = new THREE.LineSegments(wireframeGeo, wireframeMat);
    this.wireframeMesh.position.y = height / 2;
    this.group.add(this.wireframeMesh);

    this.nca.init();
  }

  update(deltaTime: number, playerDistance: number) {
    if (playerDistance < 150) {
      // Increased range
      // Use blended texture if time warping
      if (this.timeWarp < 1) {
        this.ncaTexture = this.nca.getBlendedTexture(this.timeWarp);
      } else {
        this.ncaTexture = this.nca.getTexture();
      }
      this.ncaMaterial.uniforms.ncaTexture.value = this.ncaTexture;
    }

    this.ncaMaterial.uniforms.time.value += deltaTime;
    this.ncaMaterial.uniforms.timeWarp.value = this.timeWarp;

    // Glitch handling
    if (Math.random() < 0.002) {
      this.isGlitching = true;
      this.glitchTime = 0.3;
    }

    if (this.isGlitching) {
      this.glitchTime -= deltaTime;
      this.ncaMaterial.uniforms.glitch.value = Math.max(0, this.glitchTime);
      if (this.glitchTime <= 0) {
        this.isGlitching = false;
      }
    }

    // Pulse wireframe
    const pulse =
      Math.sin(this.ncaMaterial.uniforms.time.value * 2) * 0.2 + 0.3;
    (this.wireframeMesh.material as THREE.LineBasicMaterial).opacity = pulse;

    // Wireframe color shifts with time warp
    const wireColor = this.timeWarp < 1 ? 0x0088ff : 0x00ff00;
    (this.wireframeMesh.material as THREE.LineBasicMaterial).color.setHex(
      wireColor,
    );
  }

  // Time travel!  0 = see the past, 1 = present
  setTimeWarp(value: number) {
    this.timeWarp = Math.max(0, Math.min(1, value));
  }

  triggerGlitch() {
    this.isGlitching = true;
    this.glitchTime = 1.0;
  }

  dispose() {
    this.nca.dispose();
    this.ncaTexture?.dispose();
    this.ncaMaterial.dispose();
  }
}

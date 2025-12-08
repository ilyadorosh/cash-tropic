import * as THREE from "three";
import * as tf from "@tensorflow/tfjs";

// Neural Cellular Automata on building surfaces
// Each building face is a grid of cells that evolve based on learned rules

export class NeuralCellularAutomata {
  private model: tf.LayersModel | null = null;
  private state: tf.Tensor | null = null;
  private width: number;
  private height: number;
  private channels: number = 16; // Hidden state channels
  private isRunning: boolean = false;

  constructor(width: number = 64, height: number = 64) {
    this.width = width;
    this.height = height;
  }

  async init() {
    // Simpler model without custom kernel - let it learn
    this.model = tf.sequential({
      layers: [
        // Perception layer
        tf.layers.conv2d({
          filters: 48,
          kernelSize: 3,
          padding: "same",
          inputShape: [this.height, this.width, this.channels],
          activation: "relu",
        }),
        // Update rule
        tf.layers.conv2d({
          filters: 128,
          kernelSize: 1,
          activation: "relu",
        }),
        tf.layers.conv2d({
          filters: this.channels,
          kernelSize: 1,
          activation: "tanh",
          kernelInitializer: tf.initializers.zeros(), // Start with no change
        }),
      ],
    });

    this.reset();
  }

  private createPerceptionKernel(): tf.Tensor {
    // Sobel filters for edge detection + identity
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ];
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ];
    const identity = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];

    const kernels = [];
    for (let c = 0; c < this.channels; c++) {
      kernels.push(sobelX, sobelY, identity);
    }

    return tf.tensor4d(kernels.flat(2), [
      3,
      3,
      this.channels,
      3 * this.channels,
    ]);
  }

  reset() {
    // Initialize with seed in center
    const state = tf.zeros([1, this.height, this.width, this.channels]);
    const seedX = Math.floor(this.width / 2);
    const seedY = Math.floor(this.height / 2);

    // Set seed cell to 1
    const buffer = state.bufferSync();
    for (let c = 0; c < Math.min(4, this.channels); c++) {
      buffer.set(1, 0, seedY, seedX, c);
    }

    this.state = buffer.toTensor();
  }

  step(): Float32Array | null {
    if (!this.model || !this.state) return null;

    tf.tidy(() => {
      // Apply model to get state delta
      const delta = this.model!.predict(this.state!) as tf.Tensor;

      // Stochastic update - only update some cells
      const updateMask = tf.greater(
        tf.randomUniform([1, this.height, this.width, 1]),
        0.5,
      );
      const maskedDelta = tf.mul(delta, tf.cast(updateMask, "float32"));

      // Update state
      const newState = tf.add(this.state!, tf.mul(maskedDelta, 0.1));

      // Alive masking - cells with low alpha are dead
      const alpha = newState.slice(
        [0, 0, 0, 3],
        [1, this.height, this.width, 1],
      );
      const alphaReshaped = alpha.reshape([
        1,
        this.height,
        this.width,
        1,
      ]) as tf.Tensor4D;
      const alive = tf.greater(tf.maxPool(alphaReshaped, 3, 1, "same"), 0.1);

      this.state!.dispose();
      this.state = tf.mul(newState, tf.cast(alive, "float32"));
    });

    // Return RGBA for texture (first 4 channels)
    const rgba = this.state!.slice(
      [0, 0, 0, 0],
      [1, this.height, this.width, 4],
    );
    const data = rgba.dataSync() as Float32Array;
    rgba.dispose();

    return data;
  }

  getTexture(): THREE.DataTexture {
    const data = this.step();
    if (!data) {
      return new THREE.DataTexture(
        new Uint8Array(this.width * this.height * 4),
        this.width,
        this.height,
      );
    }

    // Convert to 0-255 range
    const pixels = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < data.length; i++) {
      pixels[i] = Math.floor(
        Math.max(0, Math.min(1, data[i] * 0.5 + 0.5)) * 255,
      );
    }

    const texture = new THREE.DataTexture(pixels, this.width, this.height);
    texture.needsUpdate = true;
    return texture;
  }

  dispose() {
    this.state?.dispose();
    this.model?.dispose();
  }
}

// ADD THIS CLASS:
export class TemporalNCA extends NeuralCellularAutomata {
  private history: Float32Array[] = [];
  private maxHistory: number = 120; // 2 seconds at 60fps

  step(): Float32Array | null {
    const data = super.step();

    if (data) {
      // Store copy in history
      this.history.push(new Float32Array(data));
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    return data;
  }

  // Get state from N frames ago
  getHistoricalState(framesAgo: number): Float32Array | null {
    const index = Math.max(0, this.history.length - 1 - framesAgo);
    return this.history[index] || null;
  }

  // Blend past and present (0 = oldest, 1 = newest)
  getBlendedTexture(blend: number): THREE.DataTexture {
    const width = 64;
    const height = 64;
    const pixels = new Uint8Array(width * height * 4);

    if (this.history.length < 2) {
      return new THREE.DataTexture(pixels, width, height);
    }

    const pastIndex = Math.floor(blend * (this.history.length - 1));
    const past = this.history[pastIndex];
    const present = this.history[this.history.length - 1];

    if (past && present) {
      const t = blend % 1;
      for (let i = 0; i < width * height * 4; i++) {
        const blended = past[i] * (1 - t) + present[i] * t;
        pixels[i] = Math.floor((blended * 0.5 + 0.5) * 255);
      }
    }

    const texture = new THREE.DataTexture(pixels, width, height);
    texture.needsUpdate = true;
    return texture;
  }

  getHistoryLength(): number {
    return this.history.length;
  }

  clearHistory() {
    this.history = [];
  }
}

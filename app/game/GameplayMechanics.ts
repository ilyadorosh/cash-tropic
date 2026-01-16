// GameplayMechanics.ts - New gameplay mechanics: Computers, Data Mining, Luxury Items

import * as THREE from "three";
import {
  Computer,
  DataMiningSession,
  LuxuryItem,
  LuxuryShop,
  PlayerInventory,
  Vec3,
} from "./types";

// Computer spawn locations and definitions
export const COMPUTERS: Computer[] = [
  {
    id: "comp_laptop_1",
    position: [-80, 2, 180],
    type: "laptop",
    brand: "MacBook Pro",
    value: 2500,
    miningPower: 10,
    collected: false,
  },
  {
    id: "comp_desktop_1",
    position: [60, 2, -70],
    type: "desktop",
    brand: "Alienware",
    value: 3500,
    miningPower: 25,
    collected: false,
  },
  {
    id: "comp_server_1",
    position: [-250, 2, -150],
    type: "server",
    brand: "Dell PowerEdge",
    value: 15000,
    miningPower: 100,
    collected: false,
  },
  {
    id: "comp_super_1",
    position: [350, 2, -50],
    type: "supercomputer",
    brand: "IBM Summit",
    value: 500000,
    miningPower: 1000,
    collected: false,
  },
  {
    id: "comp_laptop_2",
    position: [85, 2, 240],
    type: "laptop",
    brand: "ThinkPad X1",
    value: 2200,
    miningPower: 12,
    collected: false,
  },
  {
    id: "comp_desktop_2",
    position: [-110, 2, -110],
    type: "desktop",
    brand: "Custom Gaming Rig",
    value: 4000,
    miningPower: 30,
    collected: false,
  },
];

// Luxury items available in the game
export const LUXURY_ITEMS: LuxuryItem[] = [
  {
    id: "lux_rolex",
    name: "Rolex Submariner",
    brand: "Rolex",
    category: "jewelry",
    price: 25000,
    prestigeBonus: 50,
    description: "Iconic luxury watch. Shows you've made it.",
    owned: false,
  },
  {
    id: "lux_gucci_suit",
    name: "Gucci Designer Suit",
    brand: "Gucci",
    category: "fashion",
    price: 15000,
    prestigeBonus: 35,
    description: "High-end Italian fashion. Stand out in style.",
    owned: false,
  },
  {
    id: "lux_macbook_pro",
    name: "MacBook Pro M3 Max",
    brand: "Apple",
    category: "tech",
    price: 8000,
    prestigeBonus: 25,
    description: "Top-tier laptop for the tech elite.",
    owned: false,
  },
  {
    id: "lux_cartier_bracelet",
    name: "Cartier Love Bracelet",
    brand: "Cartier",
    category: "jewelry",
    price: 12000,
    prestigeBonus: 30,
    description: "Exclusive jewelry piece. Pure luxury.",
    owned: false,
  },
  {
    id: "lux_porsche",
    name: "Porsche 911 GT3",
    brand: "Porsche",
    category: "vehicle",
    price: 180000,
    prestigeBonus: 150,
    description: "Ultimate sports car. Speed meets luxury.",
    unlockRequirement: {
      type: "respect",
      value: 100,
    },
    owned: false,
  },
  {
    id: "lux_penthouse",
    name: "Innenstadt Penthouse",
    brand: "Premium Real Estate",
    category: "property",
    price: 850000,
    prestigeBonus: 300,
    description:
      "Luxury penthouse in the city center. The ultimate status symbol.",
    unlockRequirement: {
      type: "respect",
      value: 200,
    },
    owned: false,
  },
  {
    id: "lux_diamond_ring",
    name: "3-Carat Diamond Ring",
    brand: "Tiffany & Co.",
    category: "jewelry",
    price: 45000,
    prestigeBonus: 80,
    description: "Flawless diamond ring. Timeless elegance.",
    unlockRequirement: {
      type: "data",
      value: 1000,
    },
    owned: false,
  },
  {
    id: "lux_louis_vuitton",
    name: "Louis Vuitton Trunk",
    brand: "Louis Vuitton",
    category: "fashion",
    price: 28000,
    prestigeBonus: 60,
    description: "Iconic luxury luggage. Travel in style.",
    owned: false,
  },
];

// Luxury shops in the game world
export const LUXURY_SHOPS: LuxuryShop[] = [
  {
    id: "shop_high_end_tech",
    name: "TechLux Boutique",
    position: [75, 0, -75],
    items: LUXURY_ITEMS.filter((item) => item.category === "tech"),
    theme: "high-tech",
    unlocked: true,
  },
  {
    id: "shop_fashion",
    name: "Königstraße Fashion",
    position: [-90, 0, -55],
    items: LUXURY_ITEMS.filter((item) => item.category === "fashion"),
    theme: "fashion",
    unlocked: true,
  },
  {
    id: "shop_jewelry",
    name: "Diamanten & Uhren",
    position: [45, 0, -120],
    items: LUXURY_ITEMS.filter((item) => item.category === "jewelry"),
    theme: "fashion",
    unlocked: true,
  },
  {
    id: "shop_automotive",
    name: "Prestige Motors",
    position: [320, 0, -80],
    items: LUXURY_ITEMS.filter((item) => item.category === "vehicle"),
    theme: "automotive",
    unlocked: false, // Unlock at higher respect
  },
  {
    id: "shop_real_estate",
    name: "Elite Properties",
    position: [-150, 0, -90],
    items: LUXURY_ITEMS.filter((item) => item.category === "property"),
    theme: "real-estate",
    unlocked: false, // Unlock at high wealth
  },
];

/**
 * GameplayManager - Handles new mechanics
 */
export class GameplayManager {
  private computers: Map<string, Computer> = new Map();
  private miningSessions: Map<string, DataMiningSession> = new Map();
  private luxuryItems: Map<string, LuxuryItem> = new Map();
  private scene: THREE.Scene;
  private computerMeshes: Map<string, THREE.Mesh> = new Map();
  private shopMeshes: Map<string, THREE.Mesh> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeComputers();
    this.initializeLuxuryItems();
  }

  private initializeComputers() {
    COMPUTERS.forEach((comp) => {
      this.computers.set(comp.id, { ...comp });
    });
  }

  private initializeLuxuryItems() {
    LUXURY_ITEMS.forEach((item) => {
      this.luxuryItems.set(item.id, { ...item });
    });
  }

  /**
   * Render computers in the 3D scene
   */
  renderComputers() {
    this.computers.forEach((computer) => {
      if (!computer.collected && !this.computerMeshes.has(computer.id)) {
        const mesh = this.createComputerMesh(computer);
        this.scene.add(mesh);
        this.computerMeshes.set(computer.id, mesh);
      }
    });
  }

  private createComputerMesh(computer: Computer): THREE.Mesh {
    // Create glowing computer representation
    const size =
      computer.type === "supercomputer"
        ? 3
        : computer.type === "server"
          ? 2
          : 1;
    const geometry = new THREE.BoxGeometry(size, size * 0.8, size * 0.6);

    // Color based on type
    const colorMap: Record<string, number> = {
      laptop: 0x3498db,
      desktop: 0x9b59b6,
      server: 0xe74c3c,
      supercomputer: 0xf39c12,
    };

    const material = new THREE.MeshStandardMaterial({
      color: colorMap[computer.type],
      emissive: colorMap[computer.type],
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      computer.position[0],
      computer.position[1],
      computer.position[2],
    );
    mesh.castShadow = true;
    mesh.userData = { type: "computer", id: computer.id };

    // Add floating animation
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;

    return mesh;
  }

  /**
   * Animate computer meshes (floating effect)
   */
  animateComputers(time: number) {
    this.computerMeshes.forEach((mesh) => {
      const floatOffset = mesh.userData.floatOffset || 0;
      const baseY = 2; // Base height for computers
      mesh.position.y = baseY + Math.sin(time * 0.002 + floatOffset) * 0.3;
      mesh.rotation.y += 0.01;
    });
  }

  /**
   * Check if player can collect a computer
   */
  checkComputerCollection(
    playerPos: Vec3,
    onCollect: (computer: Computer) => void,
  ): boolean {
    let collected = false;

    this.computers.forEach((computer) => {
      if (!computer.collected) {
        const dx = playerPos[0] - computer.position[0];
        const dz = playerPos[2] - computer.position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 5) {
          // Collection range
          computer.collected = true;
          this.removeComputerMesh(computer.id);
          onCollect(computer);
          collected = true;
        }
      }
    });

    return collected;
  }

  private removeComputerMesh(id: string) {
    const mesh = this.computerMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.computerMeshes.delete(id);
    }
  }

  /**
   * Start a data mining session
   */
  startMining(
    computerId: string,
    duration: number = 60000,
  ): DataMiningSession | null {
    const computer = this.computers.get(computerId);
    if (!computer) return null;

    const session: DataMiningSession = {
      id: `mining_${Date.now()}`,
      computerId,
      startTime: Date.now(),
      duration,
      dataYield: computer.miningPower / 10, // data per second
      totalMined: 0,
      active: true,
    };

    this.miningSessions.set(session.id, session);
    return session;
  }

  /**
   * Update all active mining sessions
   */
  updateMiningSessions(deltaTime: number): number {
    let totalNewData = 0;

    this.miningSessions.forEach((session) => {
      if (session.active) {
        const elapsed = Date.now() - session.startTime;

        if (elapsed >= session.duration) {
          session.active = false;
        } else {
          const dataThisFrame = (session.dataYield * deltaTime) / 1000;
          session.totalMined += dataThisFrame;
          totalNewData += dataThisFrame;
        }
      }
    });

    return totalNewData;
  }

  /**
   * Get active mining power
   */
  getActiveMiningPower(): number {
    let power = 0;
    this.miningSessions.forEach((session) => {
      if (session.active) {
        power += session.dataYield;
      }
    });
    return power;
  }

  /**
   * Render luxury shops
   */
  renderLuxuryShops() {
    LUXURY_SHOPS.forEach((shop) => {
      if (shop.unlocked && !this.shopMeshes.has(shop.id)) {
        const mesh = this.createShopMesh(shop);
        this.scene.add(mesh);
        this.shopMeshes.set(shop.id, mesh);
      }
    });
  }

  private createShopMesh(shop: LuxuryShop): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(15, 12, 15);
    const material = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold color for luxury
      metalness: 0.6,
      roughness: 0.3,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(shop.position[0], 6, shop.position[2]);
    mesh.castShadow = true;
    mesh.userData = { type: "luxury_shop", id: shop.id };

    return mesh;
  }

  /**
   * Check if player can purchase luxury item
   */
  canPurchase(
    itemId: string,
    playerMoney: number,
    playerRespect: number,
    playerData: number,
  ): {
    canPurchase: boolean;
    reason?: string;
  } {
    const item = this.luxuryItems.get(itemId);
    if (!item) return { canPurchase: false, reason: "Item not found" };
    if (item.owned) return { canPurchase: false, reason: "Already owned" };

    if (playerMoney < item.price) {
      return {
        canPurchase: false,
        reason: `Need €${item.price.toLocaleString()}`,
      };
    }

    if (item.unlockRequirement) {
      const req = item.unlockRequirement;
      if (req.type === "respect" && playerRespect < (req.value as number)) {
        return { canPurchase: false, reason: `Need ${req.value} respect` };
      }
      if (req.type === "data" && playerData < (req.value as number)) {
        return { canPurchase: false, reason: `Need ${req.value} data units` };
      }
    }

    return { canPurchase: true };
  }

  /**
   * Purchase a luxury item
   */
  purchaseItem(itemId: string): LuxuryItem | null {
    const item = this.luxuryItems.get(itemId);
    if (!item) return null;

    item.owned = true;
    return item;
  }

  /**
   * Get all available computers
   */
  getComputers(): Computer[] {
    return Array.from(this.computers.values());
  }

  /**
   * Get luxury shops
   */
  getLuxuryShops(): LuxuryShop[] {
    return LUXURY_SHOPS;
  }

  /**
   * Get luxury items
   */
  getLuxuryItems(): LuxuryItem[] {
    return Array.from(this.luxuryItems.values());
  }
}

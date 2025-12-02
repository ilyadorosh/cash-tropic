// AIAgentSystem.ts - Stanford Simulacra-style autonomous agents

import { AIAgent, NPCPersonality } from "./types";
import { CHARACTERS } from "./Characters";

export class AIAgentSystem {
  private agents: Map<string, AIAgent> = new Map();
  private worldTime: number = 8; // 8 AM start
  private apiEndpoint: string;

  constructor(apiEndpoint: string = "/api/characterThink") {
    this.apiEndpoint = apiEndpoint;
  }

  createAgent(
    id: string,
    personality: NPCPersonality,
    startPos: { x: number; y: number; z: number },
  ): AIAgent {
    const agent: AIAgent = {
      id,
      personality,
      position: startPos,
      currentGoal: this.generateInitialGoal(personality),
      shortTermMemory: [],
      longTermMemory: [],
      relationships: new Map(),
      lastAction: "idle",
      nextActionTime: Date.now(),
    };

    this.agents.set(id, agent);
    return agent;
  }

  private generateInitialGoal(personality: NPCPersonality): string {
    switch (personality.role) {
      case "police":
        return "patrol_area";
      case "merchant":
        return "tend_shop";
      case "girlfriend":
        return "wait_for_player";
      case "story":
        return "idle_at_location";
      default:
        return "wander";
    }
  }

  async think(agent: AIAgent, context: string): Promise<string> {
    // Build context from memory
    const memoryContext = [
      ...agent.shortTermMemory.slice(-5),
      ...agent.longTermMemory.slice(-3),
    ].join("\n");

    const prompt = `${agent.personality.systemPrompt}

Recent memories:
${memoryContext || "No recent memories. "}

Current situation: ${context}

Respond in character.  Keep it brief (1-2 sentences).  Be authentic to your personality.`;

    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: agent.id,
          context: prompt,
          systemPrompt: agent.personality.systemPrompt,
        }),
      });

      const data = await response.json();

      // Store in short-term memory
      agent.shortTermMemory.push(
        `I said: "${data.response}" about: ${context}`,
      );
      if (agent.shortTermMemory.length > 10) {
        // Compress to long-term memory
        const compressed = agent.shortTermMemory.slice(0, 5).join(" ");
        agent.longTermMemory.push(compressed);
        agent.shortTermMemory = agent.shortTermMemory.slice(5);
      }

      return data.response;
    } catch (e) {
      // Fallback to default lines
      const lines = agent.personality.defaultLines;
      return lines[Math.floor(Math.random() * lines.length)];
    }
  }

  // Autonomous behavior loop
  async updateAgent(
    agent: AIAgent,
    playerPosition: { x: number; y: number; z: number },
    worldState: any,
  ): Promise<{ action: string; dialogue?: string }> {
    if (Date.now() < agent.nextActionTime) {
      return { action: agent.lastAction };
    }

    const distanceToPlayer = Math.sqrt(
      Math.pow(agent.position.x - playerPosition.x, 2) +
        Math.pow(agent.position.z - playerPosition.z, 2),
    );

    // Decision making based on personality and state
    let action = "idle";
    let dialogue: string | undefined;

    switch (agent.personality.role) {
      case "police":
        if (worldState.wantedLevel > 0 && distanceToPlayer < 100) {
          action = "pursue_player";
          if (worldState.wantedLevel < 3 && Math.random() > 0.7) {
            dialogue = await this.think(
              agent,
              `Player has ${worldState.wantedLevel} star wanted level, within pursuit range`,
            );
          }
        } else {
          action = "patrol";
        }
        break;

      case "girlfriend":
        if (distanceToPlayer < 10) {
          action = "interact";
          if (Math.random() > 0.5) {
            const affection = agent.personality.affection || 50;
            const mood =
              affection > 70
                ? "happy to see player"
                : affection < 30
                ? "upset with player"
                : "neutral";
            dialogue = await this.think(
              agent,
              `Player approached.  Current mood: ${mood}. Affection: ${affection}/100`,
            );
          }
        } else {
          action = "wait";
        }
        break;

      case "story":
        if (distanceToPlayer < 15) {
          action = "available_for_mission";
        } else {
          action = "idle_animation";
        }
        break;

      default:
        // Pedestrian behavior
        if (distanceToPlayer < 5) {
          action = "react_to_player";
          if (Math.random() > 0.8) {
            dialogue = await this.think(
              agent,
              "Player walked very close to me",
            );
          }
        } else {
          action = "wander";
        }
    }

    agent.lastAction = action;
    agent.nextActionTime = Date.now() + 2000 + Math.random() * 3000; // 2-5 second cooldown

    return { action, dialogue };
  }

  recordInteraction(agentId: string, event: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.shortTermMemory.push(event);
    }
  }

  updateRelationship(agentId: string, targetId: string, delta: number) {
    const agent = this.agents.get(agentId);
    if (agent) {
      const current = agent.relationships.get(targetId) || 50;
      agent.relationships.set(
        targetId,
        Math.max(0, Math.min(100, current + delta)),
      );
    }
  }

  getAgent(id: string): AIAgent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AIAgent[] {
    return Array.from(this.agents.values());
  }
}

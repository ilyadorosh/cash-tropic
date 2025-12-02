// PoliceSystem.ts - Intelligent police that warn, negotiate, and pursue

import { PoliceState } from "./types";
import { POLICE_DIALOGUE } from "./Characters";

export class PoliceSystem {
  private state: PoliceState = {
    phase: "patrol",
    warningsGiven: 0,
    lastWarningTime: 0,
    negotiating: false,
  };

  private onDialogue: (text: string, title: string) => void;
  private onSpeak: (text: string, pitch: number, rate: number) => void;

  constructor(
    onDialogue: (text: string, title: string) => void,
    onSpeak: (text: string, pitch: number, rate: number) => void,
  ) {
    this.onDialogue = onDialogue;
    this.onSpeak = onSpeak;
  }

  update(
    wantedLevel: number,
    playerSpeed: number,
    distanceToNearestCop: number,
  ): PoliceState {
    if (wantedLevel === 0) {
      this.state.phase = "patrol";
      this.state.warningsGiven = 0;
      return this.state;
    }

    const now = Date.now();
    const timeSinceLastWarning = now - this.state.lastWarningTime;

    // Warning phase - give player a chance
    if (this.state.phase === "patrol" && wantedLevel > 0) {
      this.state.phase = "warning";
      this.issueWarning(1);
    }

    // Escalation logic
    if (this.state.phase === "warning") {
      if (playerSpeed < 5 && distanceToNearestCop < 20) {
        // Player is stopping - negotiate
        this.state.negotiating = true;
        this.handleSurrender();
      } else if (timeSinceLastWarning > 5000 && this.state.warningsGiven < 3) {
        // Issue next warning
        this.issueWarning(this.state.warningsGiven + 1);
      } else if (this.state.warningsGiven >= 3) {
        // Full pursuit
        this.state.phase = "pursuit";
        this.onDialogue(
          "All units - suspect is fleeing. Pursue with force.",
          "DISPATCH",
        );
        this.onSpeak("Suspect fleeing. Pursue with force.", 0.8, 1.2);
      }
    }

    // Combat phase at high wanted
    if (wantedLevel >= 4 && this.state.phase !== "combat") {
      this.state.phase = "combat";
      this.onDialogue("Lethal force authorized.", "DISPATCH");
    }

    return this.state;
  }

  private issueWarning(level: number) {
    this.state.warningsGiven = level;
    this.state.lastWarningTime = Date.now();

    const dialogue =
      POLICE_DIALOGUE[`warning_${level}` as keyof typeof POLICE_DIALOGUE];
    if (dialogue && dialogue[0]) {
      this.onDialogue(dialogue[0].text, "Officer Johnson");
      this.onSpeak(dialogue[0].text, 0.9, 1.0);
    }
  }

  private handleSurrender() {
    this.state.phase = "arrest";
    const dialogue = POLICE_DIALOGUE.surrender;

    dialogue.forEach((line, i) => {
      setTimeout(() => {
        this.onDialogue(line.text, line.speaker);
        this.onSpeak(line.text, 0.9, 1.0);
      }, i * 3000);
    });
  }

  // Called when player presses E near police
  interact(): { canSurrender: boolean; dialogue: string } {
    if (this.state.phase === "warning" || this.state.phase === "pursuit") {
      return {
        canSurrender: true,
        dialogue: "Press [SPACE] to surrender",
      };
    }

    if (this.state.phase === "patrol") {
      const lines = [
        "Move along, citizen.",
        "Stay out of trouble.",
        "I've got my eye on you.",
      ];
      return {
        canSurrender: false,
        dialogue: lines[Math.floor(Math.random() * lines.length)],
      };
    }

    return { canSurrender: false, dialogue: "" };
  }

  surrender(): {
    success: boolean;
    penalty: { money: number; weapons: boolean };
  } {
    if (this.state.phase === "warning") {
      // Light penalty for early surrender
      this.state.phase = "patrol";
      this.state.warningsGiven = 0;
      return { success: true, penalty: { money: 100, weapons: false } };
    }

    if (this.state.phase === "pursuit") {
      // Heavier penalty
      this.state.phase = "patrol";
      this.state.warningsGiven = 0;
      return { success: true, penalty: { money: 500, weapons: true } };
    }

    return { success: false, penalty: { money: 0, weapons: false } };
  }

  getState(): PoliceState {
    return { ...this.state };
  }

  reset() {
    this.state = {
      phase: "patrol",
      warningsGiven: 0,
      lastWarningTime: 0,
      negotiating: false,
    };
  }
}

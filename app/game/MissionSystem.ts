// MissionSystem.ts - Story-driven missions with branching dialogue

import { Mission, ThiefMissionState, Dialogue, DialogueOption } from "./types";
import {
  THIEF_MISSION_DIALOGUE,
  MARIA_DIALOGUE,
  CHARACTERS,
} from "./Characters";

export class MissionSystem {
  private activeMission: Mission | null = null;
  private completedMissions: Set<string> = new Set();
  private thiefState: ThiefMissionState = {
    phase: "not_started",
    thiefTrust: 0,
    dialogueIndex: 0,
  };
  private mariaAffection: number = 50;
  private mariaMetPlayer: boolean = false;

  private onDialogue: (dialogue: Dialogue) => void;
  private onSpeak: (text: string, pitch: number, rate: number) => void;
  private onReward: (money: number, respect: number) => void;

  constructor(
    onDialogue: (dialogue: Dialogue) => void,
    onSpeak: (text: string, pitch: number, rate: number) => void,
    onReward: (money: number, respect: number) => void,
  ) {
    this.onDialogue = onDialogue;
    this.onSpeak = onSpeak;
    this.onReward = onReward;
  }

  // === THIEF MISSION ===

  startThiefMission() {
    if (this.thiefState.phase !== "not_started") return;

    this.thiefState.phase = "find_thief";
    this.playDialogueSequence(THIEF_MISSION_DIALOGUE.find_thief);
  }

  interactWithThief(): Dialogue | null {
    if (this.thiefState.phase !== "find_thief") return null;

    const character = CHARACTERS.THE_THIEF;

    // First interaction - convince him
    this.thiefState.phase = "convince";

    return {
      title: character.name,
      text: THIEF_MISSION_DIALOGUE.convince_thief[0]?.text ?? "",
      options: [
        {
          text: "The priest asked for you specifically.",
          action: () => this.thiefDialogueChoice("curious"),
        },
        {
          text: "You can keep running, or you can face it.",
          action: () => this.thiefDialogueChoice("challenge"),
        },
        {
          text: "Your sister would want this.",
          action: () => this.thiefDialogueChoice("emotional"),
        },
      ],
    };
  }

  private thiefDialogueChoice(path: "curious" | "challenge" | "emotional") {
    const dialogue = THIEF_MISSION_DIALOGUE[path];
    this.playDialogueSequence(dialogue);

    // All paths lead to escort phase
    setTimeout(
      () => {
        this.thiefState.phase = "escort";
        this.thiefState.thiefTrust =
          path === "emotional" ? 80 : path === "curious" ? 60 : 40;
        this.onDialogue({
          title: "Mission Update",
          text: "Escort Vincent to the church. He'll follow you.",
        });
      },
      dialogue.length * 3000 + 1000,
    );
  }

  thiefReachedChurch() {
    if (this.thiefState.phase !== "escort") return;

    this.thiefState.phase = "deliver";
    this.playDialogueSequence(THIEF_MISSION_DIALOGUE.confession);

    setTimeout(() => {
      this.thiefState.phase = "complete";
      this.onDialogue({
        title: "MISSION PASSED",
        text: "The Confession - $5000 + Respect",
      });
      this.onReward(5000, 50);
      this.completedMissions.add("the_confession");
    }, THIEF_MISSION_DIALOGUE.confession.length * 4000);
  }

  getThiefState(): ThiefMissionState {
    return { ...this.thiefState };
  }

  // === MARIA GIRLFRIEND SYSTEM ===

  interactWithMaria(): Dialogue | null {
    const character = CHARACTERS.MARIA;

    if (!this.mariaMetPlayer) {
      this.mariaMetPlayer = true;
      return {
        title: character.name,
        text: MARIA_DIALOGUE.first_meeting[0]?.text ?? "",
        options: [
          {
            text: "I'm always looking for trouble.",
            action: () => {
              this.mariaAffection += 10;
              this.playDialogueSequence(MARIA_DIALOGUE.first_meeting.slice(1));
            },
          },
          {
            text: "Just passing through.",
            action: () => {
              this.mariaAffection -= 5;
              this.onDialogue({
                title: character.name,
                text: "That's what they all say.  See you around...  or not.",
              });
            },
          },
        ],
      };
    }

    // Return dialogue based on affection
    if (this.mariaAffection >= 80) {
      return {
        title: character.name,
        text:
          MARIA_DIALOGUE.high_affection[
            Math.floor(Math.random() * MARIA_DIALOGUE.high_affection.length)
          ]?.text ?? "",
      };
    } else if (this.mariaAffection >= 50) {
      return {
        title: character.name,
        text: MARIA_DIALOGUE.date_offer[0]?.text ?? "",
        options: [
          {
            text: "Let's go.  I know a place.",
            action: () => {
              this.mariaAffection += 15;
              this.onDialogue({
                title: "Mission Started",
                text: "Take Maria to the beach before midnight.",
              });
            },
          },
          {
            text: "Not tonight.",
            action: () => {
              this.mariaAffection -= 10;
              this.onDialogue({
                title: character.name,
                text: "Fine. I've got better things to do anyway.",
              });
            },
          },
        ],
      };
    } else {
      return {
        title: character.name,
        text: "Maybe another time.  I'm busy.",
      };
    }
  }

  getMariaAffection(): number {
    return this.mariaAffection;
  }

  changeMariaAffection(delta: number) {
    this.mariaAffection = Math.max(
      0,
      Math.min(100, this.mariaAffection + delta),
    );
  }

  // === UTILITY ===

  private playDialogueSequence(
    sequence: Array<{ speaker: string; text: string }>,
  ) {
    sequence.forEach((line, i) => {
      setTimeout(() => {
        const character = CHARACTERS[line.speaker as keyof typeof CHARACTERS];
        this.onDialogue({
          title: character?.name || line.speaker,
          text: line.text,
        });
        if (character) {
          this.onSpeak(line.text, character.voicePitch, character.voiceRate);
        }
      }, i * 3500);
    });
  }

  isMissionComplete(missionId: string): boolean {
    return this.completedMissions.has(missionId);
  }
}

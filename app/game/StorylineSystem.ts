// StorylineSystem.ts - GTA-style story progression with chapters and character arcs

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  missions: StoryMission[];
  unlockConditions: UnlockCondition[];
  rewards: ChapterReward;
}

export interface StoryMission {
  id: string;
  name: string;
  giver: string; // NPC who gives the mission
  briefing: string;
  objectives: MissionObjective[];
  dialogueIntro: string[];
  dialogueComplete: string[];
  reward: { money: number; respect: number };
  unlocked: boolean;
  completed: boolean;
}

export interface MissionObjective {
  id: string;
  type: "go_to" | "talk_to" | "escort" | "collect" | "deliver" | "survive" | "lose_wanted";
  target?: string;
  location?: { x: number; z: number; radius: number };
  description: string;
  completed: boolean;
}

export interface UnlockCondition {
  type: "mission_complete" | "money" | "respect" | "relationship";
  value: string | number;
}

export interface ChapterReward {
  money: number;
  respect: number;
  unlocks: string[]; // New areas, vehicles, weapons
}

// === THE STORYLINE ===
export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "chapter_1",
    title: "Chapter 1: Homecoming",
    description: "After years away, you return to find your old neighborhood changed. Time to reconnect... and settle old scores.",
    unlockConditions: [],
    rewards: { money: 0, respect: 0, unlocks: [] },
    missions: [
      {
        id: "m1_first_steps",
        name: "First Steps",
        giver: "INTRO",
        briefing: "Get your bearings. Find some wheels and explore the neighborhood.",
        objectives: [
          { id: "obj1", type: "go_to", location: { x: 0, z: 10, radius: 10 }, description: "Find a car", completed: false },
          { id: "obj2", type: "go_to", location: { x: -50, z: -50, radius: 20 }, description: "Drive around the block", completed: false },
        ],
        dialogueIntro: [
          "Home. At least it was, before I fucked everything up.",
          "Five years. A lot can change in five years.",
          "Let's see what's left..."
        ],
        dialogueComplete: [
          "Still know my way around. That's something.",
          "Now to find some familiar faces..."
        ],
        reward: { money: 100, respect: 5 },
        unlocked: true,
        completed: false,
      },
      {
        id: "m1_old_friends",
        name: "Old Friends",
        giver: "OG_LOC",
        briefing: "Your homie OG Loc has a problem. He always has problems. But he's family.",
        objectives: [
          { id: "obj1", type: "talk_to", target: "OG_LOC", description: "Meet OG Loc at the corner", completed: false },
          { id: "obj2", type: "go_to", location: { x: 50, z: 80, radius: 15 }, description: "Drive to the spot", completed: false },
          { id: "obj3", type: "lose_wanted", description: "Lose the heat", completed: false },
        ],
        dialogueIntro: [
          "Yo, homie! You back! I knew you'd come back!",
          "Listen, I got a situation. Some fools been disrespecting me.",
          "I need you to help me send a message, you feel me?"
        ],
        dialogueComplete: [
          "That's what I'm talking about! Just like old times!",
          "Yo, I got something else brewing. Hit me up later."
        ],
        reward: { money: 500, respect: 15 },
        unlocked: false,
        completed: false,
      },
      {
        id: "m1_confession",
        name: "The Confession",
        giver: "FATHER_MARTINEZ",
        briefing: "Father Martinez needs help with a lost soul. A thief who needs to find his way back.",
        objectives: [
          { id: "obj1", type: "talk_to", target: "FATHER_MARTINEZ", description: "Visit the church", completed: false },
          { id: "obj2", type: "talk_to", target: "THE_THIEF", description: "Find Vincent the thief", completed: false },
          { id: "obj3", type: "escort", target: "THE_THIEF", location: { x: -120, z: 50, radius: 10 }, description: "Bring him to the church", completed: false },
        ],
        dialogueIntro: [
          "My child, I've been expecting you.",
          "There's a young man... Vincent. He's lost his way.",
          "He used to be one of us. Can you bring him home?"
        ],
        dialogueComplete: [
          "You've done a good thing today. God sees all.",
          "Vincent has much to atone for, but this is a start.",
          "Bless you, my child. The community needs more people like you."
        ],
        reward: { money: 1000, respect: 25 },
        unlocked: false,
        completed: false,
      },
    ],
  },
  {
    id: "chapter_2", 
    title: "Chapter 2: Burning Heart",
    description: "Love finds you in unexpected places. But in this city, nothing comes without a price.",
    unlockConditions: [{ type: "mission_complete", value: "m1_confession" }],
    rewards: { money: 2500, respect: 50, unlocks: ["beach_area"] },
    missions: [
      {
        id: "m2_meet_maria",
        name: "Burning Heart",
        giver: "MARIA",
        briefing: "A chance encounter with Maria changes everything. She's trouble. The best kind.",
        objectives: [
          { id: "obj1", type: "talk_to", target: "MARIA", description: "Meet the mysterious woman", completed: false },
          { id: "obj2", type: "go_to", location: { x: 100, z: -80, radius: 20 }, description: "Take her somewhere nice", completed: false },
        ],
        dialogueIntro: [
          "You don't look like you're from around here.",
          "I mean, you ARE from here. But you've got that... look.",
          "Like someone who's been somewhere and come back different."
        ],
        dialogueComplete: [
          "Not bad. You might be worth my time after all.",
          "Call me. Or don't. I'll be around."
        ],
        reward: { money: 0, respect: 10 },
        unlocked: false,
        completed: false,
      },
      {
        id: "m2_date_night",
        name: "Date Night",
        giver: "MARIA",
        briefing: "Maria wants to show you her world. It's more dangerous than it looks.",
        objectives: [
          { id: "obj1", type: "go_to", location: { x: -80, z: 120, radius: 15 }, description: "Pick up Maria", completed: false },
          { id: "obj2", type: "go_to", location: { x: 150, z: 50, radius: 20 }, description: "Take her to the overlook", completed: false },
          { id: "obj3", type: "survive", description: "Deal with her ex's crew", completed: false },
        ],
        dialogueIntro: [
          "So... there's something I should tell you.",
          "My ex doesn't take rejection well. At all.",
          "He might show up. Just... be ready."
        ],
        dialogueComplete: [
          "I can't believe you did that. For me.",
          "Nobody's ever... thank you.",
          "I think I might be falling for you, and that terrifies me."
        ],
        reward: { money: 2000, respect: 30 },
        unlocked: false,
        completed: false,
      },
    ],
  },
  {
    id: "chapter_3",
    title: "Chapter 3: The Long Road",
    description: "The past catches up. Old debts, old enemies. Time to face what you've been running from.",
    unlockConditions: [
      { type: "mission_complete", value: "m2_date_night" },
      { type: "respect", value: 50 },
    ],
    rewards: { money: 10000, respect: 100, unlocks: ["industrial_district", "safehouse"] },
    missions: [
      {
        id: "m3_ghosts",
        name: "Ghosts",
        giver: "MYSTERIOUS_CALLER",
        briefing: "Someone from your past reaches out. They know things. Things you'd rather forget.",
        objectives: [
          { id: "obj1", type: "go_to", location: { x: -150, z: -100, radius: 10 }, description: "Answer the phone at the pier", completed: false },
          { id: "obj2", type: "collect", target: "evidence", description: "Find the package", completed: false },
          { id: "obj3", type: "deliver", target: "DOCTOR_MUELLER", location: { x: 80, z: -60, radius: 10 }, description: "Take it to Dr. Mueller", completed: false },
        ],
        dialogueIntro: [
          "You don't know me. But I know you.",
          "I know what you did. What really happened.",
          "There's a package. If you want the truth, find it."
        ],
        dialogueComplete: [
          "This changes everything...",
          "Who sent this? And why now?",
          "I need to know more. Whatever the cost."
        ],
        reward: { money: 5000, respect: 40 },
        unlocked: false,
        completed: false,
      },
    ],
  },
];

export class StorylineSystem {
  private chapters: StoryChapter[] = STORY_CHAPTERS;
  private currentChapterIndex: number = 0;
  private activeObjective: MissionObjective | null = null;
  private activeMission: StoryMission | null = null;

  private onNotification: (title: string, text: string, type: string) => void;
  private onDialogue: (title: string, text: string, options?: any[]) => void;
  private onReward: (money: number, respect: number) => void;

  constructor(
    onNotification: (title: string, text: string, type: string) => void,
    onDialogue: (title: string, text: string, options?: any[]) => void,
    onReward: (money: number, respect: number) => void
  ) {
    this.onNotification = onNotification;
    this.onDialogue = onDialogue;
    this.onReward = onReward;
  }

  // Initialize - unlock first mission
  init() {
    const firstMission = this.chapters[0]?.missions[0];
    if (firstMission) {
      firstMission.unlocked = true;
    }
  }

  // Get current available missions
  getAvailableMissions(): StoryMission[] {
    const missions: StoryMission[] = [];
    this.chapters.forEach(chapter => {
      chapter.missions.forEach(mission => {
        if (mission.unlocked && !mission.completed) {
          missions.push(mission);
        }
      });
    });
    return missions;
  }

  // Start a mission
  startMission(missionId: string): boolean {
    for (const chapter of this.chapters) {
      const mission = chapter.missions.find(m => m.id === missionId);
      if (mission && mission.unlocked && !mission.completed) {
        this.activeMission = mission;
        this.activeObjective = mission.objectives[0];
        
        // Show intro dialogue
        mission.dialogueIntro.forEach((line, i) => {
          setTimeout(() => {
            this.onDialogue(mission.giver, line);
          }, i * 3500);
        });

        this.onNotification("Mission Started", mission.name, "mission");
        return true;
      }
    }
    return false;
  }

  // Update - check objectives
  update(
    playerPos: { x: number; z: number },
    nearbyNPC: string | null,
    wantedLevel: number
  ): { objectiveComplete: boolean; missionComplete: boolean } {
    if (!this.activeMission || !this.activeObjective) {
      return { objectiveComplete: false, missionComplete: false };
    }

    let objectiveComplete = false;

    switch (this.activeObjective.type) {
      case "go_to":
        if (this.activeObjective.location) {
          const dist = Math.sqrt(
            Math.pow(playerPos.x - this.activeObjective.location.x, 2) +
            Math.pow(playerPos.z - this.activeObjective.location.z, 2)
          );
          if (dist < this.activeObjective.location.radius) {
            objectiveComplete = true;
          }
        }
        break;

      case "talk_to":
        if (nearbyNPC === this.activeObjective.target) {
          objectiveComplete = true;
        }
        break;

      case "escort":
        // Check if escort target is at destination
        if (this.activeObjective.location) {
          // This would need to check NPC position
          // For now, check player position as proxy
          const dist = Math.sqrt(
            Math.pow(playerPos.x - this.activeObjective.location.x, 2) +
            Math.pow(playerPos.z - this.activeObjective.location.z, 2)
          );
          if (dist < this.activeObjective.location.radius) {
            objectiveComplete = true;
          }
        }
        break;

      case "lose_wanted":
        if (wantedLevel === 0) {
          objectiveComplete = true;
        }
        break;

      case "survive":
        // Placeholder - would check if combat sequence is done
        objectiveComplete = true;
        break;
    }

    if (objectiveComplete) {
      this.activeObjective.completed = true;
      this.onNotification("Objective Complete", this.activeObjective.description, "mission");

      // Find next objective
      const currentIndex = this.activeMission.objectives.indexOf(this.activeObjective);
      const nextObjective = this.activeMission.objectives[currentIndex + 1];

      if (nextObjective) {
        this.activeObjective = nextObjective;
        return { objectiveComplete: true, missionComplete: false };
      } else {
        // Mission complete!
        return this.completeMission();
      }
    }

    return { objectiveComplete: false, missionComplete: false };
  }

  private completeMission(): { objectiveComplete: boolean; missionComplete: boolean } {
    if (!this.activeMission) return { objectiveComplete: false, missionComplete: false };

    this.activeMission.completed = true;
    
    // Show completion dialogue
    this.activeMission.dialogueComplete.forEach((line, i) => {
      setTimeout(() => {
        this.onDialogue(this.activeMission!.giver, line);
      }, i * 3000);
    });

    // Give reward
    setTimeout(() => {
      this.onNotification(
        "MISSION PASSED!",
        `${this.activeMission!.name} - $${this.activeMission!.reward.money}`,
        "mission"
      );
      this.onReward(this.activeMission!.reward.money, this.activeMission!.reward.respect);
      
      // Unlock next missions
      this.unlockNextMissions(this.activeMission!.id);
      
      this.activeMission = null;
      this.activeObjective = null;
    }, this.activeMission.dialogueComplete.length * 3000 + 1000);

    return { objectiveComplete: true, missionComplete: true };
  }

  private unlockNextMissions(completedMissionId: string) {
    // Find current chapter
    for (const chapter of this.chapters) {
      const missionIndex = chapter.missions.findIndex(m => m.id === completedMissionId);
      if (missionIndex !== -1) {
        // Unlock next mission in chapter
        const nextMission = chapter.missions[missionIndex + 1];
        if (nextMission) {
          nextMission.unlocked = true;
          this.onNotification("New Mission Available", nextMission.name, "mission");
        }

        // Check if chapter is complete
        const allComplete = chapter.missions.every(m => m.completed);
        if (allComplete) {
          // Unlock next chapter
          const chapterIndex = this.chapters.indexOf(chapter);
          const nextChapter = this.chapters[chapterIndex + 1];
          if (nextChapter && nextChapter.missions[0]) {
            nextChapter.missions[0].unlocked = true;
            this.onNotification(
              nextChapter.title,
              nextChapter.description,
              "mission"
            );
          }
        }
        break;
      }
    }
  }

  // Get current objective marker position
  getObjectiveMarker(): { x: number; z: number; active: boolean } | null {
    if (!this.activeObjective?.location) return null;
    return {
      x: this.activeObjective.location.x,
      z: this.activeObjective.location.z,
      active: true,
    };
  }

  // Get current objective description
  getCurrentObjective(): string | null {
    return this.activeObjective?.description || null;
  }

  // Get active mission
  getActiveMission(): StoryMission | null {
    return this.activeMission;
  }

  // Get story progress
  getProgress(): { chapter: number; totalChapters: number; missionsComplete: number; totalMissions: number } {
    let missionsComplete = 0;
    let totalMissions = 0;

    this.chapters.forEach(chapter => {
      chapter.missions.forEach(mission => {
        totalMissions++;
        if (mission.completed) missionsComplete++;
      });
    });

    return {
      chapter: this.currentChapterIndex + 1,
      totalChapters: this.chapters.length,
      missionsComplete,
      totalMissions,
    };
  }
}

// LearningModules.ts - Educational content woven into gameplay

export interface LearningModule {
  id: string;
  subject: "physics" | "math" | "finance" | "health" | "spiritual";
  concept: string;
  inGameManifestation: string;
  missions: string[];
  npcs: string[];
}

export const LEARNING_MODULES: LearningModule[] = [
  // === PHYSICS ===
  {
    id: "entropy",
    subject: "physics",
    concept: "Entropy & Irreversibility",
    inGameManifestation: `
      - Car crashes can't be undone (irreversible)
      - Reputation damage spreads (entropy increases)  
      - Buildings decay over time without maintenance
      - Crime creates chaos that's hard to reverse
    `,
    missions: ["entropy_lesson", "chaos_spreads"],
    npcs: ["PROFESSOR_WEBER"],
  },
  {
    id: "thermodynamics",
    subject: "physics",
    concept: "Energy & Thermodynamics",
    inGameManifestation: `
      - Cars need fuel (energy conservation)
      - Player needs food/rest (metabolism)
      - Money is like energy - transforms but conserves
      - Heat from engines, friction from brakes
    `,
    missions: ["energy_crisis", "perpetual_motion_scam"],
    npcs: ["PROFESSOR_WEBER", "MECHANIC_HANS"],
  },
  {
    id: "backprop",
    subject: "math",
    concept: "Backpropagation & Neural Networks",
    inGameManifestation: `
      - NPC AI visibly "learns" from player actions
      - Reputation system shows gradient descent
      - Mistakes propagate back through your network
      - The Neural Cellular Automata visualization
    `,
    missions: ["teach_the_ai", "network_effects"],
    npcs: ["HACKER_LISA", "PROFESSOR_WEBER"],
  },
  {
    id: "linear_algebra",
    subject: "math",
    concept: "Vectors, Matrices, Transformations",
    inGameManifestation: `
      - Car physics (velocity vectors)
      - Camera transformations
      - City grid as coordinate system
      - Missions showing transformation matrices
    `,
    missions: ["vector_chase", "coordinate_heist"],
    npcs: ["PROFESSOR_WEBER"],
  },

  // === FINANCE ===
  {
    id: "compound_interest",
    subject: "finance",
    concept: "Compound Interest & Exponential Growth",
    inGameManifestation: `
      - Business investments grow exponentially
      - Debt spirals out of control (loan sharks)
      - Reputation compounds (good or bad)
      - Bitcoin volatility and HODL lessons
    `,
    missions: [
      "loan_shark_escape",
      "investment_empire",
      "bitcoin_rollercoaster",
    ],
    npcs: ["BANKER_SCHMIDT", "LOAN_SHARK_DIMITRI", "CRYPTO_KID"],
  },
  {
    id: "risk_reward",
    subject: "finance",
    concept: "Risk vs Reward",
    inGameManifestation: `
      - High-risk missions = high reward but danger
      - Gambling mechanics with real math
      - Insurance decisions for properties
      - Portfolio diversification with businesses
    `,
    missions: ["casino_heist", "safe_investment", "all_in"],
    npcs: ["BANKER_SCHMIDT", "GAMBLER_FRITZ"],
  },

  // === HEALTH ===
  {
    id: "glycolysis",
    subject: "health",
    concept: "Sugar, Metabolism & Health",
    inGameManifestation: `
      - Energy drinks give temporary boost then crash
      - Sugar addiction mechanics (craving system)
      - Health degrades with bad choices
      - Stamina tied to nutrition
    `,
    missions: ["sugar_crash", "clean_living"],
    npcs: ["DOCTOR_MUELLER", "DEALER_ZUCKER"],
  },
  {
    id: "addiction",
    subject: "health",
    concept: "Addiction & Recovery",
    inGameManifestation: `
      - Cigarettes/caffeine give short buff, long debuff
      - Addiction meter that's hard to reverse
      - Withdrawal symptoms affect gameplay
      - Recovery missions based on 12 steps
    `,
    missions: [
      "rock_bottom",
      "first_step",
      "making_amends",
      "spiritual_awakening",
    ],
    npcs: ["SPONSOR_KLAUS", "DOCTOR_MUELLER"],
  },

  // === SPIRITUAL ===
  {
    id: "twelve_steps",
    subject: "spiritual",
    concept: "12 Steps & Redemption",
    inGameManifestation: `
      - Addiction recovery questline
      - Making amends to NPCs you've wronged
      - Sponsor system (mentor NPC)
      - Daily practices for recovery
    `,
    missions: [
      "step_1_powerless",
      "step_2_higher_power",
      "step_3_surrender",
      "step_4_inventory",
      "step_5_confession",
      "step_6_ready",
      "step_7_humility",
      "step_8_list",
      "step_9_amends",
      "step_10_continue",
      "step_11_prayer",
      "step_12_service",
    ],
    npcs: ["PFARRER_MUELLER", "SPONSOR_KLAUS"],
  },
  {
    id: "coming_to_jesus",
    subject: "spiritual",
    concept: "Faith, Grace & Transformation",
    inGameManifestation: `
      - Church as sanctuary (already implemented!)
      - Confession clears "sin" meter
      - Grace = second chances in gameplay
      - Transformation arc for player character
    `,
    missions: ["the_confession", "prodigal_return", "grace_extended"],
    npcs: ["PFARRER_MUELLER", "MARIA_TRANSFORMED"],
  },
];

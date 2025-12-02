// LearningJourney.ts - The educational path structure

export interface Lesson {
  id: string;
  subject: "physics" | "math" | "finance" | "health" | "spiritual";
  title: string;
  titleDe: string;
  description: string;
  npcTeacher: string;
  location: { x: number; z: number };
  prerequisites: string[];

  // The actual content
  dialogue: DialogueLine[];
  interactiveDemo?: string; // ID of in-game demo
  quiz?: QuizQuestion[];

  // Rewards
  reward: {
    xp: number;
    money?: number;
    respect?: number;
    unlocks?: string[]; // Unlocks next lessons or zones
  };
}

export interface DialogueLine {
  speaker: string;
  text: string;
  choices?: Array<{
    text: string;
    next: string;
    effect?: { affection?: number; xp?: number };
  }>;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// ============================================
// THE LEARNING PATHS
// ============================================

export const PHYSICS_PATH: Lesson[] = [
  {
    id: "physics_1_intro",
    subject: "physics",
    title: "Welcome to Physics",
    titleDe: "Willkommen zur Physik",
    description: "Meet Professor Weber and learn why physics matters",
    npcTeacher: "PROFESSOR_WEBER",
    location: { x: 50, z: -80 },
    prerequisites: [],
    dialogue: [
      {
        speaker: "PROFESSOR_WEBER",
        text: "Ah, ein neuer Schüler! Ich bin Professor Weber.",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Physik ist nicht nur Formeln und Zahlen.. .",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Physik erklärt ALLES was du siehst!  Die Autos, die Sonne, sogar dein Handy.",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Siehst du diese Stadt? Sie folgt den gleichen Regeln wie das Universum.",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Bist du bereit zu lernen? ",
        choices: [
          {
            text: "Ja, ich will verstehen wie alles funktioniert! ",
            next: "eager",
            effect: { xp: 10 },
          },
          {
            text: "Klingt kompliziert... ",
            next: "hesitant",
            effect: { affection: 5 },
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Was studiert die Physik?",
        options: [
          "Nur Mathematik",
          "Wie das Universum funktioniert",
          "Nur Chemie",
          "Geschichte",
        ],
        correct: 1,
        explanation:
          "Physik erklärt die grundlegenden Regeln des Universums - von Atomen bis zu Galaxien! ",
      },
    ],
    reward: { xp: 50, unlocks: ["physics_2_entropy"] },
  },

  {
    id: "physics_2_entropy",
    subject: "physics",
    title: "Entropy - Why Time Flows Forward",
    titleDe: "Entropie - Warum die Zeit vorwärts fließt",
    description: "Learn about irreversibility through car crashes",
    npcTeacher: "PROFESSOR_WEBER",
    location: { x: 50, z: -80 },
    prerequisites: ["physics_1_intro"],
    dialogue: [
      { speaker: "PROFESSOR_WEBER", text: "Heute sprechen wir über Entropie!" },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Stell dir vor: Du crashst ein Auto.  BUMM! 💥",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: 'Kannst du es "un-crashen"?  Nein!  Das ist Irreversibilität.',
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Entropie ist die Unordnung des Universums. Sie nimmt IMMER zu.",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: 'Deshalb fließt Zeit nur vorwärts. Du kannst ein Ei zerbrechen, aber nie "ent-zerbrechen"!',
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "AUFGABE: Fahre durch die Stadt.  Beobachte 3 irreversible Ereignisse.",
      },
    ],
    interactiveDemo: "car_crash_demo", // Trigger a demo in the game
    quiz: [
      {
        question: "Warum kannst du ein zerbrochenes Ei nicht reparieren?",
        options: [
          "Weil Eier klebrig sind",
          "Wegen der Entropie",
          "Weil du nicht stark genug bist",
          "Magie",
        ],
        correct: 1,
        explanation:
          "Entropie (Unordnung) nimmt immer zu.  Ein zerbrochenes Ei hat mehr Entropie als ein ganzes! ",
      },
      {
        question: "Warum fließt die Zeit nur vorwärts?",
        options: [
          "Weil Uhren so gebaut sind",
          "Wegen der Entropie",
          "Weil wir es so wollen",
          "Sie fließt auch rückwärts",
        ],
        correct: 1,
        explanation:
          "Die Richtung der Zeit ist die Richtung, in der Entropie zunimmt! ",
      },
    ],
    reward: { xp: 100, money: 50, unlocks: ["physics_3_energy"] },
  },

  {
    id: "physics_3_energy",
    subject: "physics",
    title: "Energy - The Currency of the Universe",
    titleDe: "Energie - Die Währung des Universums",
    description: "Learn how energy transforms but never disappears",
    npcTeacher: "PROFESSOR_WEBER",
    location: { x: 50, z: -80 },
    prerequisites: ["physics_2_entropy"],
    dialogue: [
      {
        speaker: "PROFESSOR_WEBER",
        text: "Energie ist wie Geld für das Universum!",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Du kannst sie nicht erschaffen oder zerstören - nur umwandeln.",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Dein Auto: Benzin → Explosion → Bewegung → Reibung → Wärme",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Die Energie ist immer da, nur in anderer Form!",
      },
      {
        speaker: "PROFESSOR_WEBER",
        text: "Dein Körper: Essen → Verdauung → ATP → Muskelbewegung → Wärme",
      },
      { speaker: "PROFESSOR_WEBER", text: "Alles ist Energie-Transformation!" },
    ],
    quiz: [
      {
        question: 'Was passiert mit Energie wenn du sie "verbrauchst"?',
        options: [
          "Sie verschwindet",
          "Sie wird zu Wärme",
          "Sie geht ins Internet",
          "Sie wird zu Nichts",
        ],
        correct: 1,
        explanation:
          "Energie verschwindet nie!  Sie wandelt sich nur um - meist in Wärme am Ende.",
      },
    ],
    reward: { xp: 100, unlocks: ["physics_4_vectors"] },
  },
];

export const SPIRITUAL_PATH: Lesson[] = [
  {
    id: "spiritual_1_rock_bottom",
    subject: "spiritual",
    title: "Rock Bottom",
    titleDe: "Am Tiefpunkt",
    description: "The beginning of the journey - admitting you need help",
    npcTeacher: "SPONSOR_KLAUS",
    location: { x: -100, z: 60 },
    prerequisites: [],
    dialogue: [
      {
        speaker: "SPONSOR_KLAUS",
        text: "Ich sehe es in deinen Augen. Du kämpfst.",
      },
      {
        speaker: "SPONSOR_KLAUS",
        text: "Ich war auch mal da wo du bist. Am Tiefpunkt.",
      },
      {
        speaker: "SPONSOR_KLAUS",
        text: "Aber weißt du was? Der Tiefpunkt kann der Anfang sein.",
      },
      { speaker: "SPONSOR_KLAUS", text: "Der Anfang von etwas Neuem." },
      {
        speaker: "SPONSOR_KLAUS",
        text: "Bist du bereit zuzugeben dass du Hilfe brauchst?",
        choices: [
          {
            text: "Ja...  ich schaffe es nicht alleine. ",
            next: "accept",
            effect: { xp: 20, affection: 10 },
          },
          {
            text: "Ich weiß nicht... ",
            next: "hesitant",
            effect: { affection: 5 },
          },
          {
            text: "Ich brauche keine Hilfe! ",
            next: "deny",
            effect: { affection: -5 },
          },
        ],
      },
    ],
    reward: { xp: 50, unlocks: ["spiritual_2_step1"] },
  },

  {
    id: "spiritual_2_step1",
    subject: "spiritual",
    title: "Step 1: Powerlessness",
    titleDe: "Schritt 1: Machtlosigkeit",
    description: "Admitting powerlessness over addiction",
    npcTeacher: "SPONSOR_KLAUS",
    location: { x: -100, z: 60 },
    prerequisites: ["spiritual_1_rock_bottom"],
    dialogue: [
      {
        speaker: "SPONSOR_KLAUS",
        text: "Der erste Schritt ist der wichtigste.",
      },
      {
        speaker: "SPONSOR_KLAUS",
        text: "Wir geben zu, dass wir MACHTLOS sind.",
      },
      {
        speaker: "SPONSOR_KLAUS",
        text: "Nicht schwach.  Machtlos.  Es ist eine Krankheit.",
      },
      {
        speaker: "SPONSOR_KLAUS",
        text: "15 Jahre habe ich versucht, alleine aufzuhören.  Es hat nie funktioniert.",
      },
      {
        speaker: "SPONSOR_KLAUS",
        text: "Erst als ich zugab dass ich es nicht alleine schaffe.. .",
      },
      {
        speaker: "SPONSOR_KLAUS",
        text: "... erst dann konnte die Heilung beginnen.",
      },
    ],
    quiz: [
      {
        question: 'Was bedeutet "machtlos" in Schritt 1?',
        options: [
          "Du bist ein Versager",
          "Du hast eine Krankheit die stärker ist als Willenskraft",
          "Du sollst aufgeben",
          "Nichts",
        ],
        correct: 1,
        explanation:
          "Sucht ist eine Krankheit.  Zuzugeben dass sie stärker ist als Willenskraft allein ist der erste Schritt zur Heilung.",
      },
    ],
    reward: { xp: 100, unlocks: ["spiritual_3_step2"] },
  },

  {
    id: "spiritual_5_confession",
    subject: "spiritual",
    title: "The Confession",
    titleDe: "Die Beichte",
    description: "Finding peace through confession at the church",
    npcTeacher: "PFARRER_MUELLER",
    location: { x: -120, z: 30 },
    prerequisites: ["spiritual_4_step4"],
    dialogue: [
      {
        speaker: "PFARRER_MUELLER",
        text: "Willkommen, mein Kind.  Die Kirche steht immer offen.",
      },
      {
        speaker: "PFARRER_MUELLER",
        text: "Ich habe viele Jahre den Menschen dieser Stadt gedient.",
      },
      {
        speaker: "PFARRER_MUELLER",
        text: "Ich habe alles gesehen. Gewalt.  Drogen. Zerbrochene Familien.",
      },
      {
        speaker: "PFARRER_MUELLER",
        text: "Aber ich habe auch Wunder gesehen. Menschen die sich verändert haben.",
      },
      {
        speaker: "PFARRER_MUELLER",
        text: "Die Beichte ist nicht für Gott. Er weiß bereits alles.",
      },
      {
        speaker: "PFARRER_MUELLER",
        text: "Die Beichte ist für DICH. Um loszulassen.",
      },
      {
        speaker: "PFARRER_MUELLER",
        text: "Möchtest du beichten?",
        choices: [
          {
            text: "Ja, Pfarrer.  Ich bin bereit.",
            next: "confess",
            effect: { xp: 50, affection: 20 },
          },
          {
            text: "Ich weiß nicht ob Gott mir vergeben kann...",
            next: "doubt",
            effect: { affection: 10 },
          },
        ],
      },
    ],
    reward: { xp: 200, respect: 30, unlocks: ["spiritual_6_step5"] },
  },
];

export const FINANCE_PATH: Lesson[] = [
  {
    id: "finance_1_compound",
    subject: "finance",
    title: "The Power of Compound Interest",
    titleDe: "Die Macht des Zinseszins",
    description: "Learn why Einstein called it the 8th wonder of the world",
    npcTeacher: "BANKER_SCHMIDT",
    location: { x: -30, z: -120 },
    prerequisites: [],
    dialogue: [
      { speaker: "BANKER_SCHMIDT", text: "Willkommen bei der Sparkasse!" },
      {
        speaker: "BANKER_SCHMIDT",
        text: "Ich zeige dir die mächtigste Kraft im Universum.",
      },
      {
        speaker: "BANKER_SCHMIDT",
        text: "Nein, nicht Gravitation.  ZINSESZINS!",
      },
      { speaker: "BANKER_SCHMIDT", text: "100€ mit 10% Zinsen.. ." },
      {
        speaker: "BANKER_SCHMIDT",
        text: "Nach 1 Jahr: 110€.  Nach 10 Jahren: 259€.  Nach 30 Jahren: 1.745€!",
      },
      {
        speaker: "BANKER_SCHMIDT",
        text: "Aber Vorsicht - Schulden wachsen genauso.  GEGEN dich.",
      },
    ],
    interactiveDemo: "compound_calculator",
    quiz: [
      {
        question: "100€ mit 10% Zinseszins nach 10 Jahren ergibt ungefähr:",
        options: ["200€", "259€", "300€", "100€"],
        correct: 1,
        explanation:
          "Bei Zinseszins wächst dein Geld exponentiell! 100 × 1.1^10 ≈ 259€",
      },
    ],
    reward: { xp: 100, money: 100, unlocks: ["finance_2_risk"] },
  },

  {
    id: "finance_3_bitcoin",
    subject: "finance",
    title: "Bitcoin & Digital Money",
    titleDe: "Bitcoin & Digitales Geld",
    description: "Learn about cryptocurrency and why it matters",
    npcTeacher: "CRYPTO_KID",
    location: { x: 80, z: -60 },
    prerequisites: ["finance_2_risk"],
    dialogue: [
      {
        speaker: "CRYPTO_KID",
        text: "Yo! Du willst über Bitcoin lernen?  Krass!",
      },
      {
        speaker: "CRYPTO_KID",
        text: "Bitcoin ist nicht nur Geld. Es ist gefrorene Energie!",
      },
      { speaker: "CRYPTO_KID", text: "Proof-of-Work = Thermodynamik, Bruder!" },
      {
        speaker: "CRYPTO_KID",
        text: "Um Bitcoin zu erschaffen brauchst du echte Energie.  Echte Arbeit.",
      },
      {
        speaker: "CRYPTO_KID",
        text: "Und die Blockchain? Absolute Irreversibilität!",
      },
      {
        speaker: "CRYPTO_KID",
        text: "Wie Professor Weber sagen würde: Entropie!",
      },
    ],
    quiz: [
      {
        question: 'Was bedeutet "Proof-of-Work"?',
        options: [
          "Ein Arbeitszeugnis",
          "Energie wird in digitales Geld umgewandelt",
          "Ein Passwort",
          "Nichts",
        ],
        correct: 1,
        explanation:
          "Bei Proof-of-Work wird echte elektrische Energie in die Sicherheit der Blockchain umgewandelt! ",
      },
    ],
    reward: { xp: 150, unlocks: ["finance_4_portfolio"] },
  },
];

export const HEALTH_PATH: Lesson[] = [
  {
    id: "health_1_sugar",
    subject: "health",
    title: "The Sugar Trap",
    titleDe: "Die Zucker-Falle",
    description: "Learn why sugar is more addictive than you think",
    npcTeacher: "DOCTOR_MUELLER",
    location: { x: 30, z: -130 },
    prerequisites: [],
    dialogue: [
      {
        speaker: "DOCTOR_MUELLER",
        text: "*sieht deinen Energy-Drink* Ah, Zucker.. .",
      },
      {
        speaker: "DOCTOR_MUELLER",
        text: "Weißt du was gerade in deinem Körper passiert?",
      },
      {
        speaker: "DOCTOR_MUELLER",
        text: "Glykolyse - dein Körper verbrennt den Zucker.",
      },
      {
        speaker: "DOCTOR_MUELLER",
        text: "Dein Blutzucker SCHIESST hoch.  Du fühlst dich gut.  Für jetzt.",
      },
      {
        speaker: "DOCTOR_MUELLER",
        text: "Dann kommt der Crash. Insulin räumt auf.  ZU VIEL Insulin.",
      },
      {
        speaker: "DOCTOR_MUELLER",
        text: "Und dann? Du brauchst MEHR Zucker. Das ist der Kreislauf.",
      },
      {
        speaker: "DOCTOR_MUELLER",
        text: "Die gleichen Belohnungszentren wie bei Kokain.  Buchstäblich.",
      },
    ],
    quiz: [
      {
        question: "Warum macht Zucker süchtig?",
        options: [
          "Weil er süß schmeckt",
          "Er aktiviert die gleichen Gehirnbereiche wie harte Drogen",
          "Macht er nicht",
          "Wegen der Farbe",
        ],
        correct: 1,
        explanation:
          "Zucker aktiviert das Dopamin-Belohnungssystem - die gleichen Bereiche die auch Drogen aktivieren! ",
      },
    ],
    reward: { xp: 100, unlocks: ["health_2_caffeine"] },
  },
];

// Get all lessons
export function getAllLessons(): Lesson[] {
  return [...PHYSICS_PATH, ...SPIRITUAL_PATH, ...FINANCE_PATH, ...HEALTH_PATH];
}

// Get next available lesson for player
export function getNextLesson(
  completedLessons: string[],
  subject?: string,
): Lesson | null {
  const lessons = subject
    ? getAllLessons().filter((l) => l.subject === subject)
    : getAllLessons();

  for (const lesson of lessons) {
    // Skip completed
    if (completedLessons.includes(lesson.id)) continue;

    // Check prerequisites
    const prereqsMet = lesson.prerequisites.every((p) =>
      completedLessons.includes(p),
    );
    if (prereqsMet) {
      return lesson;
    }
  }

  return null;
}

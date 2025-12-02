// PhysicsMissions.ts - Educational missions

import { Mission } from "./types";

export const PHYSICS_MISSIONS: Mission[] = [
  {
    id: "entropy_lesson",
    pos: [50, 1, -80], // Professor's location
    name: "Lektion: Entropie",
    camPos: [40, 5, -90],
    lookAt: [50, 2, -80],
    reward: { money: 0, respect: 10 },
    dialogue: [
      "Professor Weber: Ah, du interessierst dich für Physik! ",
      "Professor Weber: Siehst du diese Stadt? Sie ist ein perfektes Beispiel für den zweiten Hauptsatz.",
      "Professor Weber: Entropie - die Unordnung des Universums - nimmt immer zu.",
      "Professor Weber: Wenn du ein Auto crashst...  *macht Explosionsgeräusch* ...kannst du es nicht uncrash en.",
      "Professor Weber: Das ist Irreversibilität! Die Zeit fließt nur in eine Richtung.",
      "Professor Weber: Deine Aufgabe: Fahre durch die Stadt und beobachte.  Jede Aktion hat Konsequenzen die nicht rückgängig gemacht werden können.",
      "Professor Weber: Komm zurück wenn du 3 irreversible Ereignisse beobachtet hast.",
    ],
  },
  {
    id: "compound_interest_lesson",
    pos: [-30, 1, -120], // Bank
    name: "Lektion: Zinseszins",
    camPos: [-40, 5, -130],
    lookAt: [-30, 2, -120],
    reward: { money: 100, respect: 15 },
    dialogue: [
      "Direktor Schmidt: Willkommen bei der Sparkasse! ",
      "Direktor Schmidt: Ich zeige dir die mächtigste Kraft im Universum.. .",
      "Direktor Schmidt: Nein, nicht Gravitation.  ZINSESZINS!",
      "Direktor Schmidt: Wenn du 100€ sparst mit 10% Zinsen.. .",
      "Direktor Schmidt: Nach 1 Jahr: 110€. Nach 2 Jahren: 121€. Nach 10 Jahren: 259€! ",
      "Direktor Schmidt: Aber Vorsicht - Schulden funktionieren genauso.  Gegen dich.",
      "Direktor Schmidt: Hier sind 100€.  Investiere sie weise.  Ich zeige dir in 10 Spieltagen was passiert.",
    ],
  },
  {
    id: "step_1_powerless",
    pos: [-120, 1, 30], // Church
    name: "Schritt 1: Machtlosigkeit",
    camPos: [-100, 5, 40],
    lookAt: [-120, 2, 30],
    reward: { money: 0, respect: 20 },
    prerequisite: "rock_bottom", // Must hit rock bottom first
    dialogue: [
      "Klaus M.: Du bist hier.  Das ist schon ein Schritt.",
      "Klaus M.: Ich bin Klaus.  Ich war auch mal da wo du jetzt bist.",
      "Klaus M.: Der erste Schritt ist der härteste: Zugeben dass wir machtlos sind.",
      "Klaus M.: Nicht schwach.  Machtlos. Es ist eine Krankheit, kein Charakterfehler.",
      "Klaus M.: Ich habe 15 Jahre versucht es alleine zu schaffen. Hat nie geklappt.",
      "Klaus M.: Bist du bereit zuzugeben dass du Hilfe brauchst?",
      "[Spieler muss eine Wahl treffen - das Spiel erinnert sich]",
    ],
  },
  {
    id: "glycolysis_danger",
    pos: [80, 1, -100], // Near Döner shops
    name: "Der Zucker-Crash",
    camPos: [70, 5, -110],
    lookAt: [80, 2, -100],
    reward: { money: 50, respect: 10 },
    dialogue: [
      "Dr. Müller: *sieht dich Energy-Drink trinken* Stopp!",
      "Dr.  Müller: Weißt du was gerade in deinem Körper passiert? ",
      "Dr. Müller: Glykolyse - dein Körper verbrennt den Zucker.",
      "Dr. Müller: Dein Blutzucker schießt hoch. Du fühlst dich gut.  Für jetzt.",
      "Dr.  Müller: Aber dann kommt der Crash. Insulin räumt auf. Zu viel Insulin.",
      "Dr. Müller: Und dann?  Du brauchst mehr Zucker. Das ist der Kreislauf.",
      "Dr. Müller: Die gleichen Belohnungszentren wie bei harten Drogen.",
      "Dr. Müller: Willst du sehen was saubere Energie kann?  Ich zeige es dir.",
    ],
  },
];

// Achievement system for learning
export const LEARNING_ACHIEVEMENTS = [
  {
    id: "first_lesson",
    name: "Erster Schüler",
    description: "Erste Physik-Lektion abgeschlossen",
    xp: 100,
  },
  {
    id: "entropy_master",
    name: "Entropie-Meister",
    description: "Alle Entropie-Missionen abgeschlossen",
    xp: 500,
  },
  {
    id: "clean_30_days",
    name: "30 Tage Clean",
    description: "30 Spieltage ohne Suchtmittel",
    xp: 1000,
  },
  {
    id: "compound_millionaire",
    name: "Zinseszins-Millionär",
    description: "Erste Million durch Investitionen",
    xp: 2000,
  },
  {
    id: "twelve_steps_complete",
    name: "Die 12 Schritte",
    description: "Alle 12 Schritte abgeschlossen",
    xp: 5000,
  },
  {
    id: "helped_others",
    name: "Sponsor",
    description: "Hilf 3 anderen NPCs durch ihre Recovery",
    xp: 3000,
  },
];

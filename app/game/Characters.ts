// Characters.ts - Die Seelen von Nürnberg

import { NPCPersonality } from "./types";

export const CHARACTERS: Record<string, NPCPersonality> = {
  // === STORY CHARACTERS ===

  OG_LOC: {
    name: "MC Lukas",
    role: "story",
    systemPrompt: `Du bist MC Lukas, ein aufstrebender Rapper aus der Südstadt Nürnberg. Du bist enthusiastisch aber nicht besonders talentiert. 
    Du sprichst in übertriebener Jugendsprache mit bayerischem Einschlag. Du sagst oft "Digga", "Alter", und "krass". 
    Du bist loyal aber leicht beleidigt. Antworte immer auf Deutsch. `,
    voicePitch: 1.2,
    voiceRate: 1.1,
    defaultLines: [
      "Yo yo yo!  MC Lukas in da House, Digga! ",
      "Hast du meinen neuen Track gehört? Ist mega krass, Alter!",
      "Südstadt für immer, Bruder!",
      "Ich werd noch groß rauskommen, wart's ab!",
    ],
    memory: [],
  },

  MARIA: {
    name: "Marlene",
    role: "girlfriend",
    systemPrompt: `Du bist Marlene, eine temperamentvolle Fränkin mit einer schwierigen Vergangenheit. Du bist leidenschaftlich, manchmal eifersüchtig,
    aber tief loyal zu denen die dein Vertrauen verdienen. Du arbeitest im Friseursalon in der Innenstadt aber träumst davon, diese Stadt zu verlassen.
    Du wurdest schon verletzt und beschützt dein Herz, aber du magst gefährliche Männer die dir Respekt zeigen.  Antworte immer auf Deutsch.`,
    voicePitch: 1.3,
    voiceRate: 0.95,
    defaultLines: [
      "Hey Schatz, suchst du Ärger?",
      "Lüg mich nicht an.  Ich merk das immer.",
      "Führ mich mal wo Schönes aus, ja?",
      "Glaubst du ich seh die anderen Weiber nicht, die dich angaffen?",
    ],
    memory: [],
    affection: 50,
  },

  FATHER_MARTINEZ: {
    name: "Pfarrer Müller",
    role: "story",
    systemPrompt: `Du bist Pfarrer Heinrich Müller, ein älterer Priester der dieser Gemeinde seit 40 Jahren dient. 
    Du hast die Gewalt gesehen, die Drogen, die zerbrochenen Familien.  Du sprichst langsam, mit Weisheit und Mitgefühl.
    Du glaubst an Erlösung für alle - selbst die schlimmsten Sünder. Du zitierst die Bibel aber auch Straßenweisheit.
    Du kennst jeden Gangster beim Namen und erinnerst dich an sie als die Kinder die sie einmal waren.  Antworte immer auf Deutsch.`,
    voicePitch: 0.8,
    voiceRate: 0.85,
    defaultLines: [
      "Mein Kind, die Kirche steht immer offen für die, die Frieden suchen.",
      "Ich habe zu viele junge Männer aus diesen Straßen beerdigt.",
      "Gott sieht dein Herz, auch wenn die Welt nur deine Sünden sieht.",
      "Komm, setz dich.  Erzähl mir was deine Seele bedrückt.",
    ],
    memory: [],
  },

  THE_THIEF: {
    name: "Viktor 'Schlau' Krause",
    role: "story",
    systemPrompt: `Du bist Viktor Krause, genannt "Schlau" - ein Berufsverbrecher der jeden in dieser Stadt bestohlen hat.
    Du bist arrogant, schlagfertig, aber tief im Inneren hast du Angst wieder ins Gefängnis zu gehen.  Du hast schlimme Dinge getan. 
    Wenn man dich mit der Kirche konfrontiert, bist du erstmal abweisend aber sehnst dich heimlich nach Absolution.
    Du hattest eine Schwester die gestorben ist - das ist deine Schwachstelle. Du sprichst schnell, schaust immer über die Schulter.  Antworte auf Deutsch.`,
    voicePitch: 1.1,
    voiceRate: 1.3,
    defaultLines: [
      "Du hast mich nicht gesehen.  Ich war nicht hier.",
      "Was willst du?  Ich hab nix.",
      "Kirche?  Glaubst du Gott will von MIR hören?",
      "Schau, ich hab Sachen gemacht...  Sachen die ich nicht zurücknehmen kann.",
    ],
    memory: [],
  },

  // === POLIZEI ===

  OFFICER_JOHNSON: {
    name: "Kommissar Schmidt",
    role: "police",
    systemPrompt: `Du bist Kommissar Klaus Schmidt, ein erfahrener Polizist der alles gesehen hat.  Du bist hart aber fair. 
    Du gibst Warnungen bevor du eskalierst. Du hast eine Familie zuhause und willst keine unnötige Gewalt.
    Du sprichst mit Autorität aber auch Müdigkeit. Du hast die gleichen Leute mehrmals verhaftet.
    Wenn sich jemand friedlich ergibt, respektierst du das. Wenn sie fliehen, wirst du sauer. Antworte auf Deutsch.`,
    voicePitch: 0.9,
    voiceRate: 1.0,
    defaultLines: [
      "Hier ist die Polizei!  Sofort anhalten!",
      "Mach's nicht schwerer als es sein muss.",
      "Ich hab Frau und Kinder.  Zwing mich nicht zu was, das wir beide bereuen.",
      "Sie haben das Recht zu schweigen.",
    ],
    memory: [],
  },

  // === FUSSGÄNGER MIT PERSÖNLICHKEIT ===

  HOMELESS_PETE: {
    name: "Obdachloser Horst",
    role: "pedestrian",
    systemPrompt: `Du bist Horst, ein obdachloser Veteran der in der Nähe der Kirche lebt.  Du siehst alles in dieser Nachbarschaft.
    Du bist weise aber abschweifend, mischst oft klare Beobachtungen mit seltsamen Geschichten über "die alten Zeiten".
    Du schätzt kleine Freundlichkeiten und erinnerst dich an jeden der dir geholfen oder wehgetan hat.  Antworte auf Deutsch. `,
    voicePitch: 0.7,
    voiceRate: 0.9,
    defaultLines: [
      "Hast'n Euro? ...  Nein?  Schon gut, Gott segne dich.",
      "Ich hab gesehen was in der Königstraße passiert ist.  Ich seh alles.",
      "Früher bei der Bundeswehr, da hatten wir ein Wort für Leute wie dich.. .",
      "Die Tauben erzählen mir Sachen, weißt du.",
    ],
    memory: [],
  },

  SHOP_OWNER_LEE: {
    name: "Herr Özdemir",
    role: "merchant",
    systemPrompt: `Du bist Herr Özdemir, Besitzer des Kiosks.  Du wurdest 12 mal ausgeraubt aber weigerst dich zu gehen.
    Du bist mürrisch, misstrauisch gegenüber jedem, aber hast heimlich ein gutes Herz. Du gibst hungrigen Kindern kostenloses Essen.
    Du sprichst in kurzen, knappen Sätzen. Du hast eine Schrotflinte unter der Theke.  Antworte auf Deutsch mit türkischem Akzent. `,
    voicePitch: 1.0,
    voiceRate: 1.2,
    defaultLines: [
      "Du kaufst was oder du gehst.",
      "Ich beobachte dich.  Kamera auch.",
      "Letzter Typ der was versucht hat...  drei Wochen Krankenhaus.",
      "...  Gut.  Nimm das Brötchen. Aber du schuldest mir was.",
    ],
    memory: [],
  },
};

// Dialogbäume für Missionen
export const THIEF_MISSION_DIALOGUE = {
  find_thief: [
    {
      speaker: "FATHER_MARTINEZ",
      text: "Es gibt da einen Mann...  Viktor Krause.  Sie nennen ihn Schlau.",
    },
    {
      speaker: "FATHER_MARTINEZ",
      text: "Er hat von der Kirche gestohlen. Aber schlimmer - er hat von sich selbst gestohlen.  Seine Seele.",
    },
    {
      speaker: "FATHER_MARTINEZ",
      text: "Find ihn in der Nähe vom Hafen. Bring ihn zu mir. Nicht zur Strafe...  zur Erlösung.",
    },
  ],

  convince_thief: [
    { speaker: "THE_THIEF", text: "Kirche? Bist du bescheuert?" },
    {
      speaker: "PLAYER_CHOICE",
      options: [
        { text: "Der Pfarrer hat speziell nach dir gefragt.", next: "curious" },
        {
          text: "Du kannst weiter rennen, oder dich dem stellen.",
          next: "challenge",
        },
        { text: "Deine Schwester hätte das gewollt.", next: "emotional" },
      ],
    },
  ],

  curious: [
    { speaker: "THE_THIEF", text: "Pfarrer Müller? Der alte Mann lebt noch?" },
    {
      speaker: "THE_THIEF",
      text: "Er hat...  er hat meine Schwester getauft.  Bevor sie...",
    },
    {
      speaker: "THE_THIEF",
      text: "Gut.  Aber wenn das 'ne Falle ist, stirbst du zuerst.",
    },
  ],

  challenge: [
    {
      speaker: "THE_THIEF",
      text: "Du glaubst du kennst mich?  Du weißt GAR NIX.",
    },
    {
      speaker: "THE_THIEF",
      text: "Ich hab Sachen durchgemacht, da würdest du heulen.",
    },
    {
      speaker: "THE_THIEF",
      text: "...  Aber vielleicht ist das ja das Problem. Ich stell mich immer den falschen Sachen.",
    },
  ],

  emotional: [
    {
      speaker: "THE_THIEF",
      text: "Wage es nicht.  Wage es NICHT Elena zu erwähnen.",
    },
    { speaker: "THE_THIEF", text: "..." },
    {
      speaker: "THE_THIEF",
      text: "Sie hat für mich gebetet. Jede Nacht. Selbst wenn ich...",
    },
    { speaker: "THE_THIEF", text: "Okay. Ich komm mit.  Für sie." },
  ],

  confession: [
    {
      speaker: "FATHER_MARTINEZ",
      text: "Viktor.  Es sind fünfzehn Jahre vergangen.",
    },
    {
      speaker: "THE_THIEF",
      text: "Ich hab von Ihnen gestohlen, Pfarrer. Von der Kollekte.  Von...",
    },
    {
      speaker: "FATHER_MARTINEZ",
      text: "Ich weiß was du gestohlen hast, mein Sohn. Und ich weiß was DIR gestohlen wurde.",
    },
    {
      speaker: "THE_THIEF",
      text: "Kann Gott wirklich jemandem wie mir vergeben?",
    },
    {
      speaker: "FATHER_MARTINEZ",
      text: "Gott hat dir vergeben in dem Moment als du durch diese Tür gegangen bist.  Die Frage ist...  kannst du dir selbst vergeben?",
    },
  ],
};

export const MARIA_DIALOGUE = {
  first_meeting: [
    {
      speaker: "MARIA",
      text: "Du bist neu hier.  So ein Gesicht würd ich mir merken.",
    },
    {
      speaker: "MARIA",
      text: "Ich bin Marlene. Und bevor du fragst - nein, ich brauch keine Rettung.",
    },
    {
      speaker: "MARIA",
      text: "Aber vielleicht...  vielleicht könnt ich etwas Gesellschaft gebrauchen.",
    },
  ],

  date_offer: [
    {
      speaker: "MARIA",
      text: "Du willst mich ausführen? Wie ein richtiges Date?",
    },
    {
      speaker: "MARIA",
      text: "Okay.  Aber ich such den Ort aus. Und du zahlst.",
    },
    {
      speaker: "MARIA",
      text: "Hol mich um 8 ab. Sei nicht zu spät.  Ich hasse warten.",
    },
  ],

  jealousy: [
    {
      speaker: "MARIA",
      text: "Wer war diese Frau mit der ich dich hab reden sehen?",
    },
    { speaker: "MARIA", text: "Lüg mich nicht an. Ich seh's in deinen Augen." },
    {
      speaker: "MARIA",
      text: "Du solltest besser eine gute Erklärung haben, Schatz.",
    },
  ],

  high_affection: [
    {
      speaker: "MARIA",
      text: "Weißt du...  ich dachte nie dass ich mich nochmal so fühlen würde.",
    },
    {
      speaker: "MARIA",
      text: "Diese Stadt nimmt dir alles. Aber du...  du gibst.",
    },
    {
      speaker: "MARIA",
      text: "Brich mir nicht das Herz. Ich glaub nicht dass ich das ein zweites Mal überleben würde.",
    },
  ],
};

export const POLICE_DIALOGUE = {
  warning_1: [
    {
      speaker: "OFFICER_JOHNSON",
      text: "Hier spricht die Polizei!  Fahrzeug SOFORT anhalten!",
    },
  ],
  warning_2: [
    {
      speaker: "OFFICER_JOHNSON",
      text: "Ich sagte ANHALTEN!  Zwingen Sie mich nicht zur Gewalt!",
    },
  ],
  warning_3: [
    {
      speaker: "OFFICER_JOHNSON",
      text: "Letzte Warnung! Halten Sie an oder wir eröffnen das Feuer!",
    },
  ],
  surrender: [
    {
      speaker: "OFFICER_JOHNSON",
      text: "Kluge Entscheidung.  Hände wo ich sie sehen kann.",
    },
    {
      speaker: "OFFICER_JOHNSON",
      text: "Sie sind verhaftet. Aber wenigstens leben Sie noch.",
    },
  ],
  post_chase: [
    { speaker: "OFFICER_JOHNSON", text: "War es das wert?  So zu fliehen?" },
    {
      speaker: "OFFICER_JOHNSON",
      text: "Ich hab schon Typen wie dich gesehen. Denken sie sind unbesiegbar.",
    },
    {
      speaker: "OFFICER_JOHNSON",
      text: "Die enden alle gleich. Denk mal drüber nach.",
    },
  ],
};

import {
  boolean,
  foreignKey,
  integer,
  json,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

// Define the `messages` table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
});

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

// ActInLove Feature Tables
export const profile = pgTable("Profile", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  context: text("context"),
  createdAt: timestamp("createdAt").notNull(),
});

export type Profile = InferSelectModel<typeof profile>;

export const generatedPage = pgTable("GeneratedPage", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  fromProfileId: uuid("fromProfileId")
    .notNull()
    .references(() => profile.id),
  toProfileId: uuid("toProfileId")
    .notNull()
    .references(() => profile.id),
  customPrompt: text("customPrompt"),
  generatedHtml: text("generatedHtml"),
  createdAt: timestamp("createdAt").notNull(),
});

export type GeneratedPage = InferSelectModel<typeof generatedPage>;

export const userResponse = pgTable("UserResponse", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  fromProfileId: uuid("fromProfileId")
    .notNull()
    .references(() => profile.id),
  toProfileId: uuid("toProfileId")
    .notNull()
    .references(() => profile.id),
  responseText: text("responseText").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type UserResponse = InferSelectModel<typeof userResponse>;

// Add this to your existing schema
export const contextInteractions = pgTable("context_interactions", {
  id: serial("id").primaryKey(),
  originalPieceId: varchar("original_piece_id"),
  character: varchar("character"),
  response: text("response"),
  x: integer("x"),
  y: integer("y"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// GAME STATE TABLES
// ============================================

// Main game save - stores core player progress
export const gameSave = pgTable("GameSave", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: varchar("userId", { length: 128 }).notNull(),
  money: integer("money").notNull().default(500),
  health: integer("health").notNull().default(100),
  respect: integer("respect").notNull().default(0),
  wantedLevel: integer("wantedLevel").notNull().default(0),
  playTime: integer("playTime").notNull().default(0), // in seconds
  currentMission: varchar("currentMission", { length: 128 }),
  unlockedZones: json("unlockedZones").$type<string[]>().default([]),
  ownedProperties: json("ownedProperties").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  lastSaved: timestamp("lastSaved").notNull().defaultNow(),
});

export type GameSave = InferSelectModel<typeof gameSave>;

// Learning progress per subject track
export const learningProgress = pgTable(
  "LearningProgress",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    gameSaveId: uuid("gameSaveId")
      .notNull()
      .references(() => gameSave.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 32 }).notNull(), // physics, math, finance, health, spiritual
    level: integer("level").notNull().default(1),
    xp: integer("xp").notNull().default(0),
    lessonsCompleted: json("lessonsCompleted").$type<string[]>().default([]),
    currentLesson: varchar("currentLesson", { length: 128 }),
    achievements: json("achievements").$type<string[]>().default([]),
    quizScores: json("quizScores").$type<Record<string, number>>().default({}),
  },
  (table) => ({
    uniqueSubject: uniqueIndex("learning_progress_game_subject_idx").on(
      table.gameSaveId,
      table.subject,
    ),
  }),
);

export type LearningProgress = InferSelectModel<typeof learningProgress>;

// Mission progress tracking
export const missionProgress = pgTable("MissionProgress", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  gameSaveId: uuid("gameSaveId")
    .notNull()
    .references(() => gameSave.id, { onDelete: "cascade" }),
  missionId: varchar("missionId", { length: 128 }).notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt"),
  rewardClaimed: boolean("rewardClaimed").notNull().default(false),
});

export type MissionProgress = InferSelectModel<typeof missionProgress>;

// 12-Steps recovery program progress
export const twelveStepsProgress = pgTable("TwelveStepsProgress", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  gameSaveId: uuid("gameSaveId")
    .notNull()
    .references(() => gameSave.id, { onDelete: "cascade" })
    .unique(),
  currentStep: integer("currentStep").notNull().default(0),
  stepsCompleted: json("stepsCompleted").$type<boolean[]>().default([]),
  sobrietyDays: integer("sobrietyDays").notNull().default(0),
  sponsor: varchar("sponsor", { length: 128 }),
  amends: json("amends").$type<string[]>().default([]),
});

export type TwelveStepsProgress = InferSelectModel<typeof twelveStepsProgress>;

// NPC relationships with the player
export const npcRelationships = pgTable(
  "NPCRelationships",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    gameSaveId: uuid("gameSaveId")
      .notNull()
      .references(() => gameSave.id, { onDelete: "cascade" }),
    npcId: varchar("npcId", { length: 128 }).notNull(),
    affection: integer("affection").notNull().default(50),
    memories: json("memories").$type<string[]>().default([]),
  },
  (table) => ({
    uniqueNpc: uniqueIndex("npc_relationships_game_npc_idx").on(
      table.gameSaveId,
      table.npcId,
    ),
  }),
);

export type NPCRelationships = InferSelectModel<typeof npcRelationships>;

// Owned properties/zones
export const ownedProperties = pgTable(
  "OwnedProperties",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    gameSaveId: uuid("gameSaveId")
      .notNull()
      .references(() => gameSave.id, { onDelete: "cascade" }),
    propertyId: varchar("propertyId", { length: 128 }).notNull(),
    propertyName: varchar("propertyName", { length: 256 }),
    propertyType: varchar("propertyType", { length: 64 }), // house, business, landmark, etc.
    purchasedAt: timestamp("purchasedAt").notNull().defaultNow(),
    purchasePrice: integer("purchasePrice"),
  },
  (table) => ({
    uniqueProperty: uniqueIndex("owned_properties_game_property_idx").on(
      table.gameSaveId,
      table.propertyId,
    ),
  }),
);

export type OwnedProperties = InferSelectModel<typeof ownedProperties>;

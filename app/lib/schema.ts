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

// Todo items for dashboard
export const todoItem = pgTable("TodoItem", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").references(() => user.id),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  priority: integer("priority").default(0),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt"),
});

export type TodoItem = InferSelectModel<typeof todoItem>;

// Text snippets for clipboard persistence in Postgres
export const textSnippet = pgTable("TextSnippet", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").references(() => user.id),
  content: text("content").notNull(),
  title: varchar("title", { length: 256 }),
  tags: text("tags"), // JSON array stored as text
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt"),
});

export type TextSnippet = InferSelectModel<typeof textSnippet>;

// Tron grid: one row per finished match — the AI's long-term memory of you
export const tronMatch = pgTable("TronMatch", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId").references(() => user.id),
  won: boolean("won").notNull(),
  playerScore: integer("playerScore").notNull().default(0),
  aiScore: integer("aiScore").notNull().default(0),
  rounds: integer("rounds").notNull().default(0),
  survivalTicks: integer("survivalTicks").notNull().default(0),
  // net turn preference this match: rightTurns - leftTurns
  turnBias: integer("turnBias").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type TronMatch = InferSelectModel<typeof tronMatch>;

// ---------------------------------------------------------------------------
// Auth.js (NextAuth v5) + Drizzle adapter tables
//
// These are intentionally separate from the legacy `User` table above (which
// uses a `uuid` PK and password-based auth). The Auth.js adapter manages
// OAuth identities in these tables and does not conflict with the existing
// access-code / anonymous-user flow.
// ---------------------------------------------------------------------------

export const authUsers = pgTable("auth_user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export type AuthUser = InferSelectModel<typeof authUsers>;

export const authAccounts = pgTable(
  "auth_account",
  {
    userId: text("userId")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export type AuthAccount = InferSelectModel<typeof authAccounts>;

export const authSessions = pgTable("auth_session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export type AuthSession = InferSelectModel<typeof authSessions>;

export const authVerificationTokens = pgTable(
  "auth_verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export type AuthVerificationToken = InferSelectModel<
  typeof authVerificationTokens
>;

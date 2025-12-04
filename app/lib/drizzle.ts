import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql, QueryResult } from "@vercel/postgres";

("server-only");

import { genSaltSync, hashSync } from "bcrypt-ts";
import { and, asc, desc, eq, gt, isNull } from "drizzle-orm";
// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';

import {
  user,
  chat,
  User,
  document,
  Suggestion,
  suggestion,
  Message,
  message,
  vote,
  profile,
  Profile,
  generatedPage,
  GeneratedPage,
  UserResponse,
  userResponse,
  contextInteractions,
  // Game state tables
  gameSave,
  GameSave,
  learningProgress,
  LearningProgress,
  missionProgress,
  MissionProgress,
  twelveStepsProgress,
  TwelveStepsProgress,
  npcRelationships,
  NPCRelationships,
  ownedProperties,
  OwnedProperties,
} from "./schema";

import * as schema from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
// let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
// let db = drizzle(client);

export const db = drizzle(sql, { schema });

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error("Failed to save messages in database", error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error("Failed to get messages by chat id from database", error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" ? true : false })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    } else {
      return await db.insert(vote).values({
        chatId,
        messageId,
        isUpvoted: type === "up" ? true : false,
      });
    }
  } catch (error) {
    console.error("Failed to upvote message in database", error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error("Failed to get votes by chat id from database", error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save document in database");
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error("Failed to get document by id from database");
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error("Failed to get document by id from database");
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      "Failed to delete documents by id after timestamp from database",
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error("Failed to save suggestions in database");
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      "Failed to get suggestions by document version from database",
    );
    throw error;
  }
}

// Profile Management Functions
export async function getProfileByUsername({
  username,
}: {
  username: string;
}): Promise<Profile | undefined> {
  try {
    const [selectedProfile] = await db
      .select()
      .from(profile)
      .where(eq(profile.username, username));
    return selectedProfile;
  } catch (error) {
    console.error("Failed to get profile by username from database");
    throw error;
  }
}

export async function createProfile({
  username,
  context,
}: {
  username: string;
  context?: string;
}) {
  try {
    return await db.insert(profile).values({
      username,
      context: context || "",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to create profile in database");
    throw error;
  }
}

export async function updateProfile({
  username,
  context,
}: {
  username: string;
  context: string;
}) {
  try {
    return await db
      .update(profile)
      .set({ context })
      .where(eq(profile.username, username));
  } catch (error) {
    console.error("Failed to update profile in database");
    throw error;
  }
}

export async function getAllProfiles(): Promise<Array<Profile>> {
  try {
    return await db.select().from(profile).orderBy(asc(profile.username));
  } catch (error) {
    console.error("Failed to get all profiles from database");
    throw error;
  }
}

export async function deleteProfile({ username }: { username: string }) {
  try {
    return await db.delete(profile).where(eq(profile.username, username));
  } catch (error) {
    console.error("Failed to delete profile from database");
    throw error;
  }
}

// Generated Page Functions
export async function saveGeneratedPage({
  fromProfileId,
  toProfileId,
  customPrompt,
  generatedHtml,
}: {
  fromProfileId: string;
  toProfileId: string;
  customPrompt?: string;
  generatedHtml: string;
}) {
  try {
    return await db.insert(generatedPage).values({
      fromProfileId,
      toProfileId,
      customPrompt: customPrompt || null,
      generatedHtml,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save generated page in database");
    throw error;
  }
}

export async function getGeneratedPage({
  fromUsername,
  toUsername,
  customPrompt,
}: {
  fromUsername: string;
  toUsername: string;
  customPrompt?: string;
}): Promise<GeneratedPage | undefined> {
  try {
    // First get the profile IDs
    const fromProfile = await getProfileByUsername({ username: fromUsername });
    const toProfile = await getProfileByUsername({ username: toUsername });

    if (!fromProfile || !toProfile) {
      return undefined;
    }

    // Find the generated page
    const [page] = await db
      .select()
      .from(generatedPage)
      .where(
        and(
          eq(generatedPage.fromProfileId, fromProfile.id),
          eq(generatedPage.toProfileId, toProfile.id),
          customPrompt
            ? eq(generatedPage.customPrompt, customPrompt)
            : isNull(generatedPage.customPrompt),
        ),
      )
      .orderBy(desc(generatedPage.createdAt));

    return page;
  } catch (error) {
    console.error("Failed to get generated page from database");
    throw error;
  }
}

// User Response Functions
export async function saveUserResponse({
  fromUsername,
  toUsername,
  responseText,
}: {
  fromUsername: string;
  toUsername: string;
  responseText: string;
}) {
  try {
    // Get profile IDs
    const fromProfile = await getProfileByUsername({ username: fromUsername });
    const toProfile = await getProfileByUsername({ username: toUsername });

    if (!fromProfile || !toProfile) {
      throw new Error("One or both profiles not found");
    }

    return await db.insert(userResponse).values({
      fromProfileId: fromProfile.id,
      toProfileId: toProfile.id,
      responseText,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save user response in database");
    throw error;
  }
}

export async function getUserResponses({
  fromUsername,
  toUsername,
}: {
  fromUsername: string;
  toUsername: string;
}): Promise<Array<UserResponse>> {
  try {
    const fromProfile = await getProfileByUsername({ username: fromUsername });
    const toProfile = await getProfileByUsername({ username: toUsername });

    if (!fromProfile || !toProfile) {
      return [];
    }

    return await db
      .select()
      .from(userResponse)
      .where(
        and(
          eq(userResponse.fromProfileId, fromProfile.id),
          eq(userResponse.toProfileId, toProfile.id),
        ),
      )
      .orderBy(desc(userResponse.createdAt));
  } catch (error) {
    console.error("Failed to get user responses from database");
    throw error;
  }
}

// Context Interaction Functions
export async function saveContextInteraction({
  originalPieceId,
  character,
  response,
  x,
  y,
}: {
  originalPieceId: string | null;
  character?: string | null;
  response?: string | null;
  x?: number | null;
  y?: number | null;
}) {
  try {
    // Insert and return the created row's id
    const inserted = await db
      .insert(contextInteractions)
      .values({
        originalPieceId: originalPieceId ?? null,
        character: character ?? null,
        response: response ?? null,
        x: x ?? null,
        y: y ?? null,
        createdAt: new Date(),
      })
      .returning({ id: contextInteractions.id });

    // `.returning` may return an array; normalize to the first row
    if (Array.isArray(inserted)) {
      return inserted[0];
    }
    return inserted;
  } catch (error) {
    console.error("Failed to save context interaction in database", error);
    throw error;
  }
}

// ============================================
// GAME STATE FUNCTIONS
// ============================================

// GameSave CRUD operations
export async function getGameSaveByUserId({
  userId,
}: {
  userId: string;
}): Promise<GameSave | undefined> {
  try {
    const [save] = await db
      .select()
      .from(gameSave)
      .where(eq(gameSave.userId, userId))
      .orderBy(desc(gameSave.lastSaved))
      .limit(1);
    return save;
  } catch (error) {
    console.error("Failed to get game save from database", error);
    throw error;
  }
}

export async function createGameSave({
  userId,
  money = 500,
  health = 100,
  respect = 0,
  wantedLevel = 0,
  playTime = 0,
  currentMission,
  unlockedZones = ["Südstadt", "Innenstadt", "Gostenhof"],
  ownedPropertiesList = [],
}: {
  userId: string;
  money?: number;
  health?: number;
  respect?: number;
  wantedLevel?: number;
  playTime?: number;
  currentMission?: string;
  unlockedZones?: string[];
  ownedPropertiesList?: string[];
}): Promise<GameSave> {
  try {
    const [created] = await db
      .insert(gameSave)
      .values({
        userId,
        money,
        health,
        respect,
        wantedLevel,
        playTime,
        currentMission: currentMission ?? null,
        unlockedZones,
        ownedProperties: ownedPropertiesList,
        createdAt: new Date(),
        lastSaved: new Date(),
      })
      .returning();
    return created;
  } catch (error) {
    console.error("Failed to create game save in database", error);
    throw error;
  }
}

export async function updateGameSave({
  id,
  money,
  health,
  respect,
  wantedLevel,
  playTime,
  currentMission,
  unlockedZones,
  ownedPropertiesList,
}: {
  id: string;
  money?: number;
  health?: number;
  respect?: number;
  wantedLevel?: number;
  playTime?: number;
  currentMission?: string | null;
  unlockedZones?: string[];
  ownedPropertiesList?: string[];
}): Promise<GameSave> {
  try {
    const updateData: Partial<GameSave> = { lastSaved: new Date() };
    if (money !== undefined) updateData.money = money;
    if (health !== undefined) updateData.health = health;
    if (respect !== undefined) updateData.respect = respect;
    if (wantedLevel !== undefined) updateData.wantedLevel = wantedLevel;
    if (playTime !== undefined) updateData.playTime = playTime;
    if (currentMission !== undefined)
      updateData.currentMission = currentMission;
    if (unlockedZones !== undefined) updateData.unlockedZones = unlockedZones;
    if (ownedPropertiesList !== undefined)
      updateData.ownedProperties = ownedPropertiesList;

    const [updated] = await db
      .update(gameSave)
      .set(updateData)
      .where(eq(gameSave.id, id))
      .returning();
    return updated;
  } catch (error) {
    console.error("Failed to update game save in database", error);
    throw error;
  }
}

// Learning Progress operations
export async function getLearningProgressByGameSave({
  gameSaveId,
}: {
  gameSaveId: string;
}): Promise<LearningProgress[]> {
  try {
    return await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.gameSaveId, gameSaveId));
  } catch (error) {
    console.error("Failed to get learning progress from database", error);
    throw error;
  }
}

export async function upsertLearningProgress({
  gameSaveId,
  subject,
  level = 1,
  xp = 0,
  lessonsCompleted = [],
  currentLesson,
  achievements = [],
  quizScores = {},
}: {
  gameSaveId: string;
  subject: string;
  level?: number;
  xp?: number;
  lessonsCompleted?: string[];
  currentLesson?: string | null;
  achievements?: string[];
  quizScores?: Record<string, number>;
}): Promise<LearningProgress> {
  try {
    // Check if exists
    const [existing] = await db
      .select()
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.gameSaveId, gameSaveId),
          eq(learningProgress.subject, subject),
        ),
      );

    if (existing) {
      // Update
      const [updated] = await db
        .update(learningProgress)
        .set({
          level,
          xp,
          lessonsCompleted,
          currentLesson: currentLesson ?? null,
          achievements,
          quizScores,
        })
        .where(eq(learningProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert
      const [created] = await db
        .insert(learningProgress)
        .values({
          gameSaveId,
          subject,
          level,
          xp,
          lessonsCompleted,
          currentLesson: currentLesson ?? null,
          achievements,
          quizScores,
        })
        .returning();
      return created;
    }
  } catch (error) {
    console.error("Failed to upsert learning progress in database", error);
    throw error;
  }
}

// Mission Progress operations
export async function getMissionProgressByGameSave({
  gameSaveId,
}: {
  gameSaveId: string;
}): Promise<MissionProgress[]> {
  try {
    return await db
      .select()
      .from(missionProgress)
      .where(eq(missionProgress.gameSaveId, gameSaveId));
  } catch (error) {
    console.error("Failed to get mission progress from database", error);
    throw error;
  }
}

export async function completeMission({
  gameSaveId,
  missionId,
}: {
  gameSaveId: string;
  missionId: string;
}): Promise<MissionProgress> {
  try {
    // Check if exists
    const [existing] = await db
      .select()
      .from(missionProgress)
      .where(
        and(
          eq(missionProgress.gameSaveId, gameSaveId),
          eq(missionProgress.missionId, missionId),
        ),
      );

    if (existing) {
      const [updated] = await db
        .update(missionProgress)
        .set({
          completed: true,
          completedAt: new Date(),
        })
        .where(eq(missionProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(missionProgress)
        .values({
          gameSaveId,
          missionId,
          completed: true,
          completedAt: new Date(),
        })
        .returning();
      return created;
    }
  } catch (error) {
    console.error("Failed to complete mission in database", error);
    throw error;
  }
}

// Twelve Steps Progress operations
export async function getTwelveStepsProgress({
  gameSaveId,
}: {
  gameSaveId: string;
}): Promise<TwelveStepsProgress | undefined> {
  try {
    const [progress] = await db
      .select()
      .from(twelveStepsProgress)
      .where(eq(twelveStepsProgress.gameSaveId, gameSaveId));
    return progress;
  } catch (error) {
    console.error("Failed to get twelve steps progress from database", error);
    throw error;
  }
}

export async function upsertTwelveStepsProgress({
  gameSaveId,
  currentStep = 0,
  stepsCompleted = Array(12).fill(false),
  sobrietyDays = 0,
  sponsor,
  amends = [],
}: {
  gameSaveId: string;
  currentStep?: number;
  stepsCompleted?: boolean[];
  sobrietyDays?: number;
  sponsor?: string | null;
  amends?: string[];
}): Promise<TwelveStepsProgress> {
  try {
    const [existing] = await db
      .select()
      .from(twelveStepsProgress)
      .where(eq(twelveStepsProgress.gameSaveId, gameSaveId));

    if (existing) {
      const [updated] = await db
        .update(twelveStepsProgress)
        .set({
          currentStep,
          stepsCompleted,
          sobrietyDays,
          sponsor: sponsor ?? null,
          amends,
        })
        .where(eq(twelveStepsProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(twelveStepsProgress)
        .values({
          gameSaveId,
          currentStep,
          stepsCompleted,
          sobrietyDays,
          sponsor: sponsor ?? null,
          amends,
        })
        .returning();
      return created;
    }
  } catch (error) {
    console.error("Failed to upsert twelve steps progress in database", error);
    throw error;
  }
}

// NPC Relationships operations
export async function getNPCRelationshipsByGameSave({
  gameSaveId,
}: {
  gameSaveId: string;
}): Promise<NPCRelationships[]> {
  try {
    return await db
      .select()
      .from(npcRelationships)
      .where(eq(npcRelationships.gameSaveId, gameSaveId));
  } catch (error) {
    console.error("Failed to get NPC relationships from database", error);
    throw error;
  }
}

export async function upsertNPCRelationship({
  gameSaveId,
  npcId,
  affection = 50,
  memories = [],
}: {
  gameSaveId: string;
  npcId: string;
  affection?: number;
  memories?: string[];
}): Promise<NPCRelationships> {
  try {
    const [existing] = await db
      .select()
      .from(npcRelationships)
      .where(
        and(
          eq(npcRelationships.gameSaveId, gameSaveId),
          eq(npcRelationships.npcId, npcId),
        ),
      );

    if (existing) {
      const [updated] = await db
        .update(npcRelationships)
        .set({ affection, memories })
        .where(eq(npcRelationships.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(npcRelationships)
        .values({ gameSaveId, npcId, affection, memories })
        .returning();
      return created;
    }
  } catch (error) {
    console.error("Failed to upsert NPC relationship in database", error);
    throw error;
  }
}

// Owned Properties operations
export async function getOwnedPropertiesByGameSave({
  gameSaveId,
}: {
  gameSaveId: string;
}): Promise<OwnedProperties[]> {
  try {
    return await db
      .select()
      .from(ownedProperties)
      .where(eq(ownedProperties.gameSaveId, gameSaveId));
  } catch (error) {
    console.error("Failed to get owned properties from database", error);
    throw error;
  }
}

export async function addOwnedProperty({
  gameSaveId,
  propertyId,
  propertyName,
  propertyType,
  purchasePrice,
}: {
  gameSaveId: string;
  propertyId: string;
  propertyName?: string;
  propertyType?: string;
  purchasePrice?: number;
}): Promise<OwnedProperties> {
  try {
    const [created] = await db
      .insert(ownedProperties)
      .values({
        gameSaveId,
        propertyId,
        propertyName: propertyName ?? null,
        propertyType: propertyType ?? null,
        purchasedAt: new Date(),
        purchasePrice: purchasePrice ?? null,
      })
      .returning();
    return created;
  } catch (error) {
    console.error("Failed to add owned property in database", error);
    throw error;
  }
}

// Full game state loader - loads all related data for a user
export async function loadFullGameState({ userId }: { userId: string }) {
  try {
    const save = await getGameSaveByUserId({ userId });
    if (!save) {
      return null;
    }

    const [learning, missions, twelveSteps, relationships, properties] =
      await Promise.all([
        getLearningProgressByGameSave({ gameSaveId: save.id }),
        getMissionProgressByGameSave({ gameSaveId: save.id }),
        getTwelveStepsProgress({ gameSaveId: save.id }),
        getNPCRelationshipsByGameSave({ gameSaveId: save.id }),
        getOwnedPropertiesByGameSave({ gameSaveId: save.id }),
      ]);

    return {
      save,
      learning,
      missions,
      twelveSteps,
      relationships,
      properties,
    };
  } catch (error) {
    console.error("Failed to load full game state from database", error);
    throw error;
  }
}

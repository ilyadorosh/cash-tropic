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

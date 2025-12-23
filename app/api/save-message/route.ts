import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import fs from "fs/promises";
import path from "path";

// Path to saved messages file
const SAVED_MESSAGES_PATH = path.join(
  process.cwd(),
  "data",
  "saved_messages.json",
);

interface SavedMessage {
  id: string;
  content: string;
  role: string;
  savedAt: number;
  sessionId?: string;
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(SAVED_MESSAGES_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read saved messages from file
async function readSavedMessages(): Promise<SavedMessage[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(SAVED_MESSAGES_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    return [];
  }
}

// Write saved messages to file
async function writeSavedMessages(messages: SavedMessage[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(SAVED_MESSAGES_PATH, JSON.stringify(messages, null, 2));
}

// POST - Save a message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, role, sessionId } = body;

    if (!content || !role) {
      return NextResponse.json(
        { error: "Content and role are required" },
        { status: 400 },
      );
    }

    const savedMessage: SavedMessage = {
      id: nanoid(),
      content,
      role,
      savedAt: Date.now(),
      sessionId,
    };

    // Save to file
    const messages = await readSavedMessages();
    messages.push(savedMessage);
    await writeSavedMessages(messages);

    // Also save to Redis if upstash is configured
    try {
      const upstashEndpoint = process.env.UPSTASH_REDIS_REST_URL;
      const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (upstashEndpoint && upstashToken) {
        const redisKey = `saved_message:${savedMessage.id}`;
        const redisUrl = `${upstashEndpoint}/set/${redisKey}`;

        await fetch(redisUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${upstashToken}`,
          },
          body: JSON.stringify(savedMessage),
        });
        console.log("[SaveMessage] Saved to Redis:", redisKey);
      }
    } catch (redisError) {
      console.error("[SaveMessage] Failed to save to Redis:", redisError);
      // Don't fail the request if Redis fails
    }

    return NextResponse.json({
      success: true,
      message: savedMessage,
    });
  } catch (error) {
    console.error("[SaveMessage] Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 },
    );
  }
}

// GET - Retrieve all saved messages
export async function GET(req: NextRequest) {
  try {
    const messages = await readSavedMessages();
    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("[SaveMessage] Error reading messages:", error);
    return NextResponse.json(
      { error: "Failed to read messages" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import {
  ensureAnonUser,
  ensureChat,
  saveMessages,
  getMessagesByChatId,
  getChatsByUserId,
} from "@/app/lib/drizzle";

// Cloud backup for chat sessions — no login required. The client mints a
// stable anonymous user id (localStorage) and a per-session cloud chat id,
// then POSTs only the messages that haven't been saved yet. GET restores
// either one chat's messages (?sessionId=) or a user's chat list (?userId=).

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userId, title, messages } = body ?? {};

    if (
      typeof sessionId !== "string" ||
      typeof userId !== "string" ||
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "sessionId, userId, and messages[] are required",
        },
        { status: 400 },
      );
    }

    await ensureAnonUser(userId);
    await ensureChat({ id: sessionId, userId, title: title || "Untitled" });

    await saveMessages({
      messages: messages.map((m: any) => ({
        id: crypto.randomUUID(),
        chatId: sessionId,
        role: String(m.role ?? "user"),
        content: m.content ?? "",
        createdAt: m.date ? new Date(m.date) : new Date(),
      })),
    });

    return NextResponse.json({ success: true, saved: messages.length });
  } catch (error) {
    console.error("[storeChat POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to store chat" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const userId = searchParams.get("userId");

  try {
    if (sessionId) {
      const messages = await getMessagesByChatId({ id: sessionId });
      return NextResponse.json({ success: true, messages });
    }
    if (userId) {
      const chats = await getChatsByUserId({ id: userId });
      return NextResponse.json({ success: true, chats });
    }
    return NextResponse.json(
      { success: false, error: "Provide sessionId or userId" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[storeChat GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch backup" },
      { status: 500 },
    );
  }
}

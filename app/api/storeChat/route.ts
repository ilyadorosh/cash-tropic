import { NextRequest, NextResponse } from "next/server";

import { Redis } from "@upstash/redis";

import { sql, QueryResult } from "@vercel/postgres";
import { db, saveMessages } from "@/app/lib/drizzle";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import {
  message,
  user,
  chat,
  document,
  suggestion,
  Message,
  vote,
} from "@/app/lib/schema";
import { ChatMessage } from "@/app/store";
import { generateUUID } from "../common";

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  const notclonedBody = await req.clone().json();

  try {
    // await kv.set('myresp', 'hi ' + textData);
    // await kv.set('mystate', 'hi '+req.clone().body.text());
    // const textData = await req.json()

    // await kv.set("mystate", notclonedBody);
    // await kv.lpush("mylist", notclonedBody);
    console.log("[sending this to Groq in storeChat] ", notclonedBody);

    const filteredMessages = notclonedBody.filter(
      (message: ChatMessage) => message.role === "user",
    );
    console.log(
      "[hello from storeChat] ",
      // filteredMessages.slice(-1)[0],
    );
    // storeMessagesInDB(filteredMessages.slice(-1));

    const id = "b9b1d0e7-ac54-4856-ac52-2308a58e91a1";
    await saveMessages({
      messages: [
        {
          ...filteredMessages.slice(-1)[0],
          id: generateUUID(),
          createdAt: new Date(),
          chatId: id,
        },
      ],
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } finally {
    clearTimeout(timeoutId);
  }
}

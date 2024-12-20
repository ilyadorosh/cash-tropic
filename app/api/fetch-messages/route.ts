import { sql, QueryResult } from "@vercel/postgres";
import { db } from "@/app/lib/drizzle";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import {
  messages,
  user,
  chat,
  document,
  suggestion,
  Message,
  vote,
} from "@/app/lib/schema";

export async function GET() {
  try {
    const id = "9a7de449-a3f2-48d6-83ee-7c340b2afd49";
    const resp = await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
    return new Response(JSON.stringify(resp), { status: 200 });
  } catch (error) {
    console.error("Failed to get chats by user from database");
    return new Response(JSON.stringify({ error: "Error fetching messages" }), {
      status: 500,
    });
  }
}

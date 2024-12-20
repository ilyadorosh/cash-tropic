// import { sql, QueryResult } from '@vercel/postgres';
// import { db } from '@/app/lib/drizzle';
import { messages } from "@/app/lib/schema";

export async function GET() {
  // try {
  //     const result: QueryResult<{ id: number; title: string }[]> = await sql`SELECT * FROM Chat ORDER BY id DESC`;
  //     const messages = result.rows;
  //     return new Response(JSON.stringify({ messages: messages.map((msg) => msg) }), { status: 200 });
  // } catch (error) {
  //     console.error(error);
  //     return new Response(JSON.stringify({ error: 'Error fetching messages' }), { status: 500 });
  // }
}

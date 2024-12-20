import { QueryResult, sql } from "@vercel/postgres";
import { kv } from "@vercel/kv";

export async function POST(req: Request) {
  try {
    const sourceList = "mylist";
    const destList = "userList:love";
    const index = 1; // 9th element (0-based index)

    // Get the 9th element
    const element = await kv.lindex(sourceList, index);
    if (!element) {
      return new Response(JSON.stringify({ error: "Element not found!" }), {
        status: 404,
      });
    }

    // Remove the 9th element
    await kv.lrem(sourceList, 1, element);

    // Add to the destination list
    await kv.rpush(destList, element);

    // Save to PostgreSQL
    const query = sql<
      { id: number; message: string }[]
    >`INSERT INTO message (message) VALUES (${element}) RETURNING *`;
    const savedMessage: QueryResult<{ id: number; message: string }[]> =
      await query;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
    });
  }
}

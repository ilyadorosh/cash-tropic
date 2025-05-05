import { QueryResult, sql } from "@vercel/postgres";
import { Redis } from "@upstash/redis";

export async function POST(req: Request) {
  const redis = Redis.fromEnv();
  try {
    const sourceList = "mylist";
    const destList = "userList:love";
    const index = 1; // 9th element (0-based index)

    // Get the 9th element
    const element = await redis.lindex(sourceList, index);
    if (!element) {
      return new Response(JSON.stringify({ error: "Element not found!" }), {
        status: 404,
      });
    }

    // Remove the 9th element
    await redis.lrem(sourceList, 1, element);

    // Add to the destination list
    await redis.rpush(destList, element);

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

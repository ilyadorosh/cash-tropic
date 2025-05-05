import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import {
  getChatById,
  getChatsByUserId,
  getMessagesByChatId,
  getUser,
} from "@/app/lib/drizzle";

export async function GET(req: Request, context: any) {
  const redis = Redis.fromEnv();
  const pid = await redis.lrange("mylist", 0, 10);
  // const myid = "bf2c869e-db8b-48df-a5f3-1e5694a90549";
  const myid = "6a382696-dbf7-46dc-94c7-7add3c1042d7";
  const mychat = getMessagesByChatId({ id: myid });
  const email = "ilyadorosh@gmail.com";
  let users = await getUser(email);
  let chats = await getChatsByUserId({ id: users[0].id });
  // res.end(`Posts: ${pid}`)

  return NextResponse.json({
    message: "Hello, Shawn, please go to illigen.fun/safespace/prompt!",
    // input: pid,
    chats: chats,
    user: users,
  });
}

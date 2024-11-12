import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request, context: any) {
  const pid = await kv.lrange("mylist", 0, -1);
  // res.end(`Posts: ${pid}`)

  return NextResponse.json({
    message: "Hello, Shawn, please go to illigen.fun/safespace/prompt!",
    input: pid,
  });
}

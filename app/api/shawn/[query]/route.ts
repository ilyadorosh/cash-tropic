import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: any) {
  const { params } = context;

  const p_output = "this will be a returned response from the api here";

  await kv.set("user_1_session", "session_token_value");
  const session = await kv.get("user_1_session");

  // string
  await kv.set("key", "value");
  let data = await kv.get("key");
  console.log(data); // 'value' US: +1-650-503-4034 Customer support

  return NextResponse.json({
    message: "Hello, Shawn, please go to illige.fun/safespace/prompt!" + data,
    input: params,
    output: p_output,
  });
}

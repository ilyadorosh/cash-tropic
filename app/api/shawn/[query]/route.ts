import { GROQ_BASE_URL, GroqPath } from "@/app/constant";
import { createMessage } from "@/app/store/chat";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: any) {
  const redis = Redis.fromEnv();
  const { params } = context;

  let baseUrl = GROQ_BASE_URL;
  let chatPath = GroqPath.ChatPath;
  const fetchUrl = `${baseUrl}/${chatPath}`;
  console.log("fetchUrl", fetchUrl);
  let authValue = process.env.GROQ_API_KEY?.toString() ?? "";
  const controller = new AbortController();

  const mybody = {
    messages: [
      {
        role: "system",
        content:
          "you are responding with the most useful info, then being deeply philosophical in the end and uses emojis.",
      },
      {
        role: "user",
        content: params.query,
      },
    ],
    model: "llama-3.3-70b-versatile",
    max_tokens: 4000,
    temperature: 0.6,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
    stream: false,
  };

  const authHeaderName = "Authorization"; // Define the authHeaderName variable and provide a value for it

  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      [authHeaderName]: "Bearer " + authValue,
    },
    method: "POST",
    body: JSON.stringify(mybody), // Convert mybody object to JSON string
    // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };
  console.log("fetchOptions", fetchOptions);

  const res = await fetch(fetchUrl, fetchOptions);
  console.log("res", res);
  if (!res.ok) {
    throw new Error(`Error: ${res.status} ${res.statusText}`);
  }

  const responseData = await res.json();

  console.log("Response Data:", responseData);

  const p_output = responseData.choices[0].message; //"this will be a returned response from the api here";

  //await kv.set("user_1_session", "session_token_value");
  //const session = await kv.get("user_1_session");

  // string
  await redis.rpush("loveQueries", params.query);
  let data = await redis.get("key");
  console.log(data); // 'value' US: +1-650-503-4034 Customer support

  return NextResponse.json({
    message: "Hello, Shawn, please go to illige.fun/safespace/prompt!" + data,
    input: params,
    output: p_output,
  });
}

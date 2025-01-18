import { kv } from "@vercel/kv";
import {
  getChatById,
  getChatsByUserId,
  getMessagesByChatId,
  getUser,
} from "@/app/lib/drizzle";
import Locale from "@/app/locales";
import { GROQ_BASE_URL, GroqPath } from "@/app/constant";
import React from "react";
import dynamic from "next/dynamic";

import { ChatWTFElement } from "@/app/components-next/chat-list-next";

// import { doSave } from "@/app/store/sync";

export default async function Cart({ params }: { params: { query: string } }) {
  const onInput = (text: string) => {
    const n = text.trim().length;
  };

  // await kv.hset("userSession", { user: params.user });

  // await kv.set(
  //   "userCache:" + "shawn",
  //   "you translate into or from portugese and german and use emojis."
  // );
  await kv.rpush(
    "userCacheMessages:" + "shawn",
    params.query + " " + new Date().toISOString(),
  );
  let data = (await kv.get("userCache:" + "shawn")) as string;
  // doSave(params.user)
  //() => doSave(params.user)
  const email = "smurpster@gmail.com";
  let users = await getUser(email);
  let chats = await getChatsByUserId({ id: users[0].id });

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
        content: data,
      },
      {
        role: "user",
        content: params.query,
      },
    ],
    model: "llama3-8b-8192",
    max_tokens: 1000,
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

  let allthechats = [];

  return (
    <>
      <div>
        {/* I will not stop. How about you, Shawn? {data} */}
        <b>{p_output.content}</b>
        <textarea value={params.query} />
        <button>Save</button>
        <ChatWTFElement chats={chats} />
      </div>

      {/* <ChatList narrow={shouldNarrow} /> */}

      {/* <ChatWTF chats={chats}/> */}
    </>
  );
}

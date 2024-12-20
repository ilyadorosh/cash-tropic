import { kv } from "@vercel/kv";
import {
  getChatById,
  getChatsByUserId,
  getMessagesByChatId,
  getUser,
} from "@/app/lib/drizzle";
import React from "react";
import dynamic from "next/dynamic";
const ChatList = dynamic(
  async () => (await import("@/app/components-next/chat-list-next")).ChatList,
  {
    loading: () => null,
  },
);

// import { doSave } from "@/app/store/sync";

export default async function Cart({ params }: { params: { user: string } }) {
  const onInput = (text: string) => {
    const n = text.trim().length;
  };

  await kv.hset("userSession", { user: params.user });

  await kv.set(
    "userCache:" + params.user,
    "єбать эти все ваши вещи, я не могу это терпеть",
  );
  let data = (await kv.get("userCache:" + params.user)) as string;
  // doSave(params.user)
  //() => doSave(params.user)
  const email = "ilyadorosh@gmail.com";
  let users = await getUser(email);
  let chats = await getChatsByUserId({ id: users[0].id });

  return (
    <div>
      {data}
      <p>I will not stop. How about you, {params.user}?</p>
      <textarea value={data} />
      <button>Save</button>

      <iframe
        width="425"
        height="350"
        src="https://www.openstreetmap.org/export/embed.html?bbox=-1.9775390625000002%2C44.449467536006935%2C27.026367187500004%2C57.3146573557333&amp;layer=mapnik"
      ></iframe>
      <br />
      <small>
        <a href="https://www.openstreetmap.org/#map=6/51.33/12.52">
          View Larger Map
        </a>
      </small>
    </div>
  );
}

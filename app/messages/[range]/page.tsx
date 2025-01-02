import { kv } from "@vercel/kv";
import React from "react";

import styles from "@/app/components/chat.module.scss";

import {
  ChatMessage,
  ModelType,
  useAppConfig,
  useChatStore,
} from "@/app/store";
import Link from "next/link";
import { GROQ_BASE_URL, GroqPath } from "@/app/constant";
import path from "path";

// import { doSave } from "@/app/store/sync";

export default async function Cart({ params }: { params: { range: number } }) {
  const pid = await kv.lrange("mylist", params.range, params.range);

  const conversations = pid
    .map((item) => {
      try {
        return typeof item === "string" ? JSON.parse(item) : item;
      } catch (error) {
        console.error("Failed to parse item:", item, error);
        return null;
      }
    })
    .filter(Boolean);

  let baseUrl = GROQ_BASE_URL;
  let chatPath = GroqPath.ChatPath;
  const fetchUrl = `https://${baseUrl}/${chatPath}`;
  console.log("fetchUrl", fetchUrl);
  let authValue = process.env.GROQ_API_KEY?.toString() ?? "";

  const authHeaderName = "Authorization"; // Define the authHeaderName variable and provide a value for it

  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      [authHeaderName]: authValue,
    },
  };
  // const res = await fetch(fetchUrl, fetchOptions);

  return (
    <div className={styles.chat}>
      <Link href={`/messages/${Number(params.range) + 1}`}>Next</Link>
      <div className={styles["chat-body"]}>
        {conversations.map((conversation, index) => (
          <div className={styles["chat-message-container"]} key={index}>
            <div className={styles["chat-message-item"]}>
              {conversation.messages.map((message: ChatMessage, i: number) => {
                return (
                  <div className={styles["chat-message-item"]} key={i}>
                    {message.content && <>{message.content}</>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div>====</div>

        {conversations.map((conversation, index) => (
          <div className={styles["chat-message-container"]} key={index}>
            <div className={styles["chat-message-item"]}>
              {conversation.messages
                .filter((message: ChatMessage) => message.role === "user")
                .map((message: ChatMessage, i: number) => {
                  return (
                    <div className={styles["chat-message-item"]} key={i}>
                      {message.content && <>{message.content}</>}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { sql } from "@vercel/postgres";
import { Redis } from "@upstash/redis";
import React from "react";

import styles from "@/app/components/chat.module.scss";

import {
  ChatMessage,
  ModelType,
  useAppConfig,
  useChatStore,
} from "@/app/store";

export default async function Cart({
  params,
}: {
  params: { username: string };
}) {
  const redis = Redis.fromEnv();
  const pid = await redis.lrange("userList:" + params.username, 0, 30);
  const userCacheString: string | null = await redis.get(
    "userCache:" + params.username,
  );
  const htmlText = userCacheString?.replace(/\n/g, "<br>");

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

  return (
    <div className={styles.chat}>
      <div className={styles["chat-body"]}>
        <h1>==Любовь, это она меня заставила это делать!?==</h1>
        <br></br>
        <hr></hr>
        <div className={styles["chat-body-text"]}>
          {userCacheString as React.ReactNode}
        </div>
        {conversations.slice(0, 13).map((conversation, index) => (
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
      </div>
    </div>
  );
}

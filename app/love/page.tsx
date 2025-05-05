import { Redis } from "@upstash/redis";
import { sql } from "@vercel/postgres";
import React from "react";

import styles from "@/app/components/chat.module.scss";

import { ChatMessage, ModelType, useAppConfig, useChatStore } from "../store";

export default async function Cart() {
  const kv = Redis.fromEnv();
  //function that writes to the db
  const write = async (messages: ChatMessage[]) => {
    const result =
      await sql`INSERT INTO mylist (messages) VALUES (${JSON.stringify(
        messages,
      )})`;
    const likes = 100;
    const { rows } = await sql`SELECT * FROM posts WHERE likes > ${likes};`;
  };

  const { rows } = await sql`SELECT * FROM User;`;
  const pid = await kv.lrange("userList:love", 0, 30);

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
        <div>==Любаша пишет че-то==</div>
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

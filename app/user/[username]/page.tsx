import { Redis } from "@upstash/redis";
import Link from "next/link";
import React from "react";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

import styles from "@/app/components/chat.module.scss";
import { ChatMessage } from "@/app/store";

const D3Chart = dynamic(() => import("./d3component"), {
  ssr: false,
});

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const { username } = params;
  return {
    title: `${username}'s conversations`,
    description: `View AI conversations and shared content from ${username} on CzatBoltzmannPlanck.`,
    openGraph: {
      title: `${username} on CzatBoltzmannPlanck`,
      description: `AI conversations and generated content from ${username}.`,
      type: "profile",
    },
    robots: { index: true, follow: true },
  };
}

export default async function UserPage({
  params,
}: {
  params: { username: string };
}) {
  const redis = Redis.fromEnv();
  const pid = await redis.lrange("userList:" + params.username, 0, 30);
  const userCacheString: string | null = await redis.get(
    "userCache:" + params.username,
  );

  const keys = await redis.keys("userCache:" + "*");

  const conversations = pid
    .map((item) => {
      try {
        return typeof item === "string" ? JSON.parse(item) : item;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return (
    <div className={styles.chat}>
      <div className={styles["chat-body"]}>
        <h1>{params.username}</h1>

        <nav>
          {keys.map((key: string, index: number) => {
            const keyUsername = key.replace("userCache:", "") as string;
            return (
              <div key={index}>
                <Link href={`/user/${keyUsername}`}>{keyUsername}</Link>
              </div>
            );
          })}
        </nav>

        <hr />

        {userCacheString && (
          <div className={styles["chat-body-text"]}>{userCacheString}</div>
        )}

        {conversations.slice(0, 13).map((conversation, index) => (
          <div className={styles["chat-message-container"]} key={index}>
            <div className={styles["chat-message-item"]}>
              {conversation.messages.map((message: ChatMessage, i: number) => (
                <div className={styles["chat-message-item"]} key={i}>
                  {message.content && <>{message.content}</>}
                </div>
              ))}
            </div>
          </div>
        ))}

        <D3Chart />
      </div>
    </div>
  );
}

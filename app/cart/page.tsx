import { Redis } from "@upstash/redis";
import React from "react";

import styles from "@/app/components/chat.module.scss";

import { ChatMessage, ModelType, useAppConfig, useChatStore } from "../store";
import { ClientApi, RequestMessage, getClientApi } from "../client/api";
import { DEFAULT_INPUT_TEMPLATE, ServiceProvider } from "../constant";

// import { doSave } from "@/app/store/sync";

export default async function Cart() {
  const kv = Redis.fromEnv();
  const pid = await kv.lrange("mylist", 10, 13);

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

  // Log the pid array to debug
  console.log("PID Array:", pid.length, " : len : ", pid);
  // const messages = Array(pid[0])
  // const config = useAppConfig.getState();
  // const modelConfig =
  //  {
  //   model: "gemma2-9b-it" as ModelType,
  //   // model: "gpt-4o-mini" as ModelType,
  //   providerName: "Groq" as ServiceProvider,
  //   // providerName: "OpenAI" as ServiceProvider,
  //   temperature: 0.6,
  //   top_p: 1,
  //   max_tokens: 4000,
  //   presence_penalty: 0,
  //   frequency_penalty: 0,
  //   sendMemory: true,
  //   historyMessageCount: 4,
  //   compressMessageLengthThreshold: 1000,
  //   enableInjectSystemPrompts: true,
  //   template: DEFAULT_INPUT_TEMPLATE,
  // };

  // const api: ClientApi = getClientApi("Groq" as ServiceProvider);

  // api.llm.chat({
  //   messages: [{role: "user", content: "Hello"}] as RequestMessage[],
  //   config: {
  //     model: "gemma2-9b-it",
  //     stream: false,
  //   },
  //   onFinish(message) {
  //     console.log("onFinish", message);
  //   },
  // });

  //Parse each string in the pid array into an object, with error handling
  // const messages = pid.map((item) => {
  //   try {
  //     return JSON.parse(item);
  //   } catch (error) {
  //     console.error("Failed to parse item:", item, error);
  //     return null; // Return null for items that can't be parsed
  //   }
  // }).filter(Boolean); // Remove null values

  // // Filter out the messages that are not from the user
  // const userMessages = messages.filter((message) => message.role === "user");

  // return (
  //   <div>
  //     {userMessages.map((message, index) => (
  //       <p key={index}>
  //         {message.content}
  //       </p>
  //     ))}
  //     <textarea
  //       value={userMessages.map((message) => message.content).join("\n")}
  //     />
  //     <button>Save</button>
  //   </div>
  // );
  return (
    <div className={styles.chat}>
      <div className={styles["chat-body"]}>
        {/* {pid[0].messages[0].content} */}
        {/* {conversations.slice(0, 3).map((conversation, index) => (
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
        ))} */}
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

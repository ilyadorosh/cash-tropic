import { kv } from "@vercel/kv";
import React from "react";

import styles from "@/app/components/chat.module.scss";
import {
  List,
  ListItem,
  Modal,
  Select,
  showImageModal,
  showModal,
  showToast,
} from "@/app/components/ui-lib";

import { ChatMessage, useAppConfig, useChatStore } from "../store";

// import { doSave } from "@/app/store/sync";

export default async function Cart() {
  const pid = await kv.lrange("mylist", 0, 100000);

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

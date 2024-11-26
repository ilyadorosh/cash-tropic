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

// import { doSave } from "@/app/store/sync";

export default async function Cart() {
  const pid = await kv.lrange("mylist", 0, 100000);

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
        {pid.map((conversation, index) => (
          <div className={styles["chat-message-container"]} key={index}>
            <div className={styles["chat-message-item"]}>
              {conversation.messages
                .filter((message) => message.role === "user")
                .map((message, i) => {
                  return (
                    <div className={styles["chat-message-item"]} key={i}>
                      {message.content}
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

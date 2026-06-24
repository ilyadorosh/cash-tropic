"use client";

import { useParams } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { IconButton } from "@/app/components/button";
import SendWhiteIcon from "@/app/icons/send-white.svg";
import Locale from "@/app/locales";
import styles from "@/app/components/chat.module.scss";
import { useChatStore, useAppConfig } from "@/app/store";
import { LAST_INPUT_KEY } from "@/app/constant";
import { autoGrowTextArea, useMobileScreen } from "@/app/utils";
import NewsPicker from "@/app/components/newspicker";

export default function SafeSpaceQuery() {
  const params = useParams();
  const chatStore = useChatStore();
  const [userInput, setUserInput] = useState("");
  const isMobileScreen = useMobileScreen();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const onInput = (text: string) => {
    setUserInput(text);
  };

  const doSubmit = (input: string) => {
    chatStore.onUserInput(input);
    localStorage.setItem(LAST_INPUT_KEY, input);
    setUserInput("");
    if (!isMobileScreen) inputRef.current?.focus();
  };

  useEffect(() => {
    if (isMobileScreen && inputRef.current) {
      autoGrowTextArea(inputRef.current);
    }
  }, [isMobileScreen]);

  return (
    <div>
      <NewsPicker
        value="North"
        greyout="West, East"
        nolabel={false}
        nobutton={false}
      />
      <textarea
        id="chat-input"
        ref={inputRef}
        className={styles["chat-input"]}
        value={userInput}
        onInput={(e) => onInput(e.currentTarget.value)}
        placeholder={`Ask about ${params.query}...`}
      />
      <IconButton
        icon={<SendWhiteIcon />}
        text={Locale.Chat.Send}
        className={styles["chat-input-send"]}
        type="primary"
        onClick={() => doSubmit(userInput)}
      />
    </div>
  );
}

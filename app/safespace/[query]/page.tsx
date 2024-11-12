"use client";

import { useParams } from "next/navigation";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
  RefObject,
} from "react";

import { IconButton } from "@/app/components/button";
import SendWhiteIcon from "@/app/icons/send-white.svg";
import Locale from "@/app/locales";
import styles from "@/app/components/chat.module.scss";
import ChatGptIcon from "@/app/icons/InferiorAI.svg";
import BotIcon from "@/app/icons/bot.svg";

import {
  ChatMessage,
  SubmitKey,
  useChatStore,
  BOT_HELLO,
  createMessage,
  useAccessStore,
  Theme,
  useAppConfig,
  DEFAULT_TOPIC,
  ModelType,
} from "@/app/store";

import {
  CHAT_PAGE_SIZE,
  LAST_INPUT_KEY,
  Path,
  REQUEST_TIMEOUT_MS,
  UNFINISHED_INPUT,
  ServiceProvider,
  Plugin,
} from "@/app/constant";

import {
  copyToClipboard,
  selectOrCopy,
  autoGrowTextArea,
  useMobileScreen,
  getMessageTextContent,
  getMessageImages,
  isVisionModel,
} from "@/app/utils";

import { Prompt, usePromptStore } from "@/app/store/prompt";
import NewsPicker from "@/app/components/newspicker";
export type RenderPrompt = Pick<Prompt, "title" | "content">;

function MySafeSpaceQuery() {
  const [queryParam, setQueryParam] = useState("");
  const params = useParams();

  const chatStore = useChatStore();
  const session = chatStore.currentSession();

  const [userInput, setUserInput] = useState(queryParam);
  const [promptHints, setPromptHints] = useState<RenderPrompt[]>([]);
  const isMobileScreen = useMobileScreen();
  const [autoScroll, setAutoScroll] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const onInput = (text: string) => {
    setUserInput(text);
    const n = text.trim().length;
  };

  //setUserInput(queryParam);

  const doSubmit = (userInput: string) => {
    chatStore.onUserInput(userInput);
    localStorage.setItem(LAST_INPUT_KEY, userInput);
    setUserInput("");
    setPromptHints([]);
    if (!isMobileScreen) inputRef.current?.focus();
    setAutoScroll(true);
  };
  //userInput = userInput + " " + queryParam + params.query;
  const doPopulate = (userInput: string) => {
    setUserInput(userInput + " " + queryParam + params.query);
  };

  useEffect(() => {
    if (isMobileScreen) {
      if (inputRef.current) {
        autoGrowTextArea(inputRef.current);
      }
    }
  }, [isMobileScreen]);

  const state = {
    value: "North",
    greyout: "West, East",
    nolabel: false,
    nobutton: false,
  };

  return (
    <div>
      <NewsPicker
        value={state.value}
        greyout={state.greyout}
        nolabel={state.nolabel}
        nobutton={state.nobutton}
      />
      <h1>I am not a professional manager</h1>
      <ul>
        <li>business paid community</li>
        <li>job descriptions</li>
      </ul>

      <h2>Slides</h2>
      <ul>
        <li>big vision</li>
        <li>Brands logos</li>
        <li>demo</li>
      </ul>
      <ul>
        <li>
          {" "}
          if subsidizing usage and paying users is not a market fit, nothing is
        </li>
        <li>
          {" "}
          good vibes, is how it is different. has to be 10x better, or just
          unique and different
        </li>
        <li>
          {" "}
          start writing, changing something, nobody is going to judge me here.
        </li>
        <li> I am $25K manager</li>
      </ul>
      <p>Fine-tuned models, irreversible consequences, burned energy.</p>
      <textarea
        id="chat-input"
        ref={inputRef}
        className={styles["chat-input"]}
        value={userInput}
        onInput={(e) => onInput(e.currentTarget.value)}
      />
      <IconButton text={"populate"} onClick={() => doPopulate(userInput)} />
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

export default MySafeSpaceQuery;

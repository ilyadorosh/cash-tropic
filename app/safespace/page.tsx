"use client";

import React from "react";
import { useEffect, useState } from "react";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";
import About from "@/app/components/about";
import ChatGptIcon from "@/app/icons/InferiorAI.svg";
import BotIcon from "@/app/icons/bot.svg";
import styles from "@/app/components/chat.module.scss";

import styles1 from "@/app/components/home.module.scss";
import { SideBar } from "@/app/components-next/sidebar-next";
import { Path, SlotID } from "../constant";

import Loading from "./loading"; // Import Loading from a separate file

const Chat = dynamic(
  async () => (await import("@/app/components-next/chat-next")).Chat,
  {
    loading: () => <Loading noLogo />,
    ssr: false,
  },
);

const NewChat = dynamic(
  async () => (await import("@/app/components/new-chat")).NewChat,
  {
    loading: () => <Loading noLogo />,
    ssr: false,
  },
);

const MaskPage = dynamic(
  async () => (await import("@/app/components/mask")).MaskPage,
  {
    loading: () => <Loading noLogo />,
    ssr: false,
  },
);

function ParamsMy() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  // const fetchedChat = fetch("/api/shawn/" + search);
  return (
    <li>
      This: {search} was supposed to be a param input. anyways, the user diagram
      will go into the chat and the db diagram will go into another chat
    </li>
  );
}

const ICONS = [BotIcon, ChatGptIcon];

const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * ICONS.length);
  return ICONS[randomIndex];
};

function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles1["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function MyPage() {
  const [queryParam, setQueryParam] = useState("");
  const number = useSearchParams().get("search");
  const n = number ? number : 8; // Or something else

  return (
    <div className={`${styles1.container}`}>
      <SideBar className={styles1["sidebar-show"]} />
      <div className="scroll">
        <style jsx>{`
          .scroll {
            overflow-y: auto;
          }
        `}</style>
        <div className={styles.iconGrid}>
          {[...Array(n)].map((_, rowIndex) => (
            <div className={styles.row} key={rowIndex}>
              {[...Array(n)].map((_, colIndex) => {
                const IconComponent = getRandomIcon();
                return (
                  <span className={styles.cell} key={`${rowIndex}-${colIndex}`}>
                    <IconComponent />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <h1>&quot; Любовь опасная &quot;</h1>
        <ul>
          <li>Она там просила меня документацию написать... </li>
          {/* <Suspense>
            <ParamsMy />
          </Suspense> */}
        </ul>
        <h2>Бизнеss-план:</h2>
        <ul>
          <li>Инвестирование from:</li>
          <li>Первый канал, Газпром, РЖД, РПЦ, Москвич</li>
        </ul>
        <textarea defaultValue={"i LOVE U " + queryParam} />
        <About />
      </div>

      {/* Use Next.js routing without react-router-dom */}
      {/* Render your components directly */}
      <Chat />
    </div>
  );
}

export default MyPage;

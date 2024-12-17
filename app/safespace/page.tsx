"use client";

import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import { Suspense } from "react";
import About from "@/app/components/about";
import ChatGptIcon from "@/app/icons/InferiorAI.svg";
import BotIcon from "@/app/icons/bot.svg";
import styles from "@/app/components/chat.module.scss";

import styles1 from "@/app/components/home.module.scss";
import { SideBar } from "@/app/components/sidebar";
import { Path, SlotID } from "../constant";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      I am kinda loading...
      <About />
    </div>
  );
}

const Chat = dynamic(async () => (await import("@/app/components/chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(
  async () => (await import("@/app/components/new-chat")).NewChat,
  {
    loading: () => <Loading noLogo />,
  },
);

const MaskPage = dynamic(
  async () => (await import("@/app/components/mask")).MaskPage,
  {
    loading: () => <Loading noLogo />,
  },
);

function ParamsMy() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const fetchedChat = fetch("/api/shawn/" + search);
  return (
    <li>
      This: {search} was supposed to be a param input. anyways, the user diagram
      will go into the chat and the db diagram will go into another chat
    </li>
  );
}

const n = 8; // Or something else

const ICONS = [BotIcon, ChatGptIcon];

const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * ICONS.length);
  return ICONS[randomIndex];
};

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles1["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function MyPage() {
  const [queryParam, setQueryParam] = useState("");

  return (
    <div className={`${styles1.container}`}>
      <Router>
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
                    <span
                      className={styles.cell}
                      key={`${rowIndex}-${colIndex}`}
                    >
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
            <Suspense>
              <ParamsMy />
            </Suspense>
          </ul>
          <h2>Бизнеss-план:</h2>
          <ul>
            <li>Инвестирование from:</li>
            <li>Первый канал, Газпром, РЖД, РПЦ, Москвич</li>
          </ul>
          <textarea defaultValue={"i LOVE U " + queryParam} />
          <About />
        </div>

        <WindowContent>
          <Routes>
            <Route path={Path.Home} element={<Chat />} />
            <Route path={Path.NewChat} element={<NewChat />} />
            <Route path={Path.Masks} element={<MaskPage />} />
            <Route path={Path.Chat} element={<Chat />} />
          </Routes>
        </WindowContent>
      </Router>
    </div>
  );
}

export default MyPage;

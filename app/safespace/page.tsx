"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Suspense } from "react";
import About from "@/app/components/about";
import ChatGptIcon from "@/app/icons/InferiorAI.svg";
import BotIcon from "@/app/icons/bot.svg";
import styles from "@/app/components/chat.module.scss";

function ParamsMy() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  return <li>This: {search}</li>;
}

const n = 8; // Or something else

const ICONS = [BotIcon, ChatGptIcon];

const getRandomIcon = () => {
  const randomIndex = Math.floor(Math.random() * ICONS.length);
  return ICONS[randomIndex];
};

function MyPage() {
  const [queryParam, setQueryParam] = useState("");

  return (
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
  );
}

export default MyPage;

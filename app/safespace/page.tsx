"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Suspense } from "react";
import About from "@/app/components/about";

function ParamsMy() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  return <li>This: {search}</li>;
}

function MyPage() {
  const [queryParam, setQueryParam] = useState("");

  return (
    <div>
      <h1>&quot; Любовь - опасная женщина &quot;</h1>
      <ul>
        <li>Она там просила меня документацию написать... </li>
        <Suspense>
          <ParamsMy />
        </Suspense>
      </ul>
      <h2>Бизнесс-план:</h2>
      <ul>
        <li>Инвестирование:</li>
        <li>Первый канал, Газпром, РЖД, РПЦ, Москвич</li>
      </ul>
      <textarea defaultValue={"i LOVE U " + queryParam} />
      <About />
    </div>
  );
}

export default MyPage;

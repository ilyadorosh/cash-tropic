"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function MyPage() {
  const [queryParam, setQueryParam] = useState("");

  const searchParams = useSearchParams();

  const search = searchParams.get("search");

  return (
    <div>
      <h1>&quot; Любовь - опасная женщина &quot;</h1>
      <ul>
        <li>Она там просила меня документацию написать... </li>
        <li>This: {search}</li>
      </ul>
      <h2>Бизнесс-план:</h2>
      <ul>
        <li>Инвестирование:</li>
        <li>Первый канал, Газпром, РЖД, РПЦ, Москвич</li>
      </ul>
      <textarea defaultValue={"i LOVE U " + queryParam} />
    </div>
  );
}

export default MyPage;

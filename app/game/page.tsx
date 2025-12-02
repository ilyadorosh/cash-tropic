"use client";

import dynamic from "next/dynamic";

const GameEngine = dynamic(() => import("./Engine"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        color: "#76b900",
        fontSize: "24px",
      }}
    >
      Loading Game...
    </div>
  ),
});

export default function GamePage() {
  return <GameEngine />;
}

"use client";

import dynamic from "next/dynamic";


import { useState } from "react";

const Engine2D = dynamic(() => import("./Engine2D"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0a", color: "#76b900", fontSize: "24px" }}>
      Loading 2D Engine...
    </div>
  ),
});

const Engine3D = dynamic(() => import("./Engine3D"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0a", color: "#76b900", fontSize: "24px" }}>
      Loading 3D Engine...
    </div>
  ),
});

export default function GamePage() {
  const [mode, setMode] = useState<"2d" | "3d">("3d");

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#111", position: "relative" }}>
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
        <button
          onClick={() => setMode("3d")}
          style={{
            marginRight: 8,
            padding: "8px 16px",
            background: mode === "3d" ? "#76b900" : "#222",
            color: mode === "3d" ? "#fff" : "#76b900",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          3D Engine
        </button>
        <button
          onClick={() => setMode("2d")}
          style={{
            padding: "8px 16px",
            background: mode === "2d" ? "#76b900" : "#222",
            color: mode === "2d" ? "#fff" : "#76b900",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          2D Engine
        </button>
      </div>
      <div style={{ width: "100vw", height: "100vh" }}>
        {mode === "3d" ? <Engine3D /> : <Engine2D />}
      </div>
    </div>
  );
}

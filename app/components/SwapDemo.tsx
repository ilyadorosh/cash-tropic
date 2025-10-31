// components/SwapDemo.tsx
"use client";

import { useState } from "react";

export default function SwapDemo() {
  const [input, setInput] = useState("");

  // Entropy rerouter – swap.js core
  const swap = (word: string): string => {
    const map: Record<string, string> = {
      war: "train",
      sugar: "steak",
      chocolate: "pumpkin seeds",
      regret: "flush",
      "i don't know": "i do",
      apply: "sent",
      "job center": "grant",
      clogged: "drain open",
      "i have to stop": "i just started",
      mom: "ally",
      jelly: "gone",
      drain: "clear",
      tomorrow: "now",
    };
    return map[word.toLowerCase()] || word;
  };

  const output = input.trim().split(/\s+/).map(swap).join(" ");

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black text-green-400 font-mono rounded-lg shadow-lg">
      <h2 className="text-2xl mb-4">Actinlove – Live Entropy Rerouter</h2>
      <p className="mb-6 opacity-80">Type your pain. Watch it reroute.</p>

      <input
        id="swap-in"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="war, sugar, regret..."
        className="w-full p-3 mb-4 bg-gray-900 border border-green-600 rounded text-lg focus:outline-none focus:border-yellow-400"
      />

      <div className="text-left p-4 bg-gray-900 rounded border border-yellow-600">
        <span className="text-yellow-400 font-bold text-xl">
          → {output || "peace"}
        </span>
      </div>

      <p className="mt-6 text-sm opacity-60">
        Built live. No backend. Just truth.
      </p>
    </div>
  );
}

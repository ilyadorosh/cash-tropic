"use client";

import dynamic from "next/dynamic";

// canvas + WebAudio game: client-only, zero bytes until this route is opened
const TronGame = dynamic(() => import("./TronGame"), { ssr: false });

export default function TronPage() {
  return <TronGame />;
}

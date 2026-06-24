"use client";

import React from "react";
import { Suspense } from "react";
import styles from "@/app/components/home.module.scss";
import { SideBar } from "@/app/components-next/sidebar-next";
import { SlotID } from "../constant";
import Loading from "./loading";
import dynamic from "next/dynamic";

const Chat = dynamic(
  async () => (await import("@/app/components-next/chat-next")).Chat,
  {
    loading: () => <Loading noLogo />,
    ssr: false,
  },
);

export default function SafeSpacePage() {
  return (
    <div className={`${styles.container}`}>
      <SideBar className={styles["sidebar-show"]} />
      <div
        className={styles["window-content"]}
        id={SlotID.AppBody}
        style={{ overflowY: "auto" }}
      >
        <Chat />
      </div>
    </div>
  );
}

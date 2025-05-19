//please populate this
// just a regular component to import
"use client";
import React, { useEffect, useRef, useMemo, useState, Fragment } from "react";

import { useNavigate } from "react-router-dom";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import styles from "@/app/components/home.module.scss";

import { Path, SlotID } from "@/app/constant";
import { SideBar } from "@/app/components/sidebar";

import SettingsIcon from "@/app/icons/settings.svg";
import GithubIcon from "../icons/github.svg";

import dynamic from "next/dynamic";

export function Loading(props: { noLogo?: boolean }) {
  return <div className={styles["loading-content"] + " no-dark"}>hi</div>;
}
const Settings = dynamic(
  async () => (await import("@/app/components/settings")).Settings,
  {
    loading: () => <Loading noLogo />,
  },
);

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

export function D3component() {
  // const navigate = useNavigate();
  useEffect(() => {
    // Example of client-side code using window object or client-side libraries
    const someClientSideAction = () => {
      console.log("This runs on the client side");
    };

    someClientSideAction();
  }, []);
  return (
    <div>
      <h1>I am AI</h1>
      <SettingsIcon />
      <div className={`${styles.container} ${styles["tight-container"]} `}>
        <Router>
          <SideBar className={styles["sidebar-show"]} />
          <div className={styles["window-content"]} id={SlotID.AppBody}>
            <Routes>
              <Route path={Path.Home} element={<Chat />} />
              <Route path={Path.NewChat} element={<NewChat />} />
              <Route path={Path.Masks} element={<MaskPage />} />
              <Route path={Path.Chat} element={<Chat />} />
              <Route path={Path.Settings} element={<Settings />} />
              {/* <Route path={Path.Experimental} element={<About />} /> */}
            </Routes>
          </div>
        </Router>
      </div>
      <p>
        Любовь, это она меня заставила это делать!<br></br>
        Русская версия активируется только в Москве, при триумфальной встрече с
        высшими лицами всей этой вакханалии
      </p>

      <link href="https://www.riddletiger.com/legal-details" />
    </div>
  );
}

export default D3component;

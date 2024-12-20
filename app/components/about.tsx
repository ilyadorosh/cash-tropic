import React, { useEffect, useRef, useMemo, useState, Fragment } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  PLUGINS,
  REPO_URL,
} from "../constant";

export function About() {
  return (
    <div>
      <h1>About</h1>
      <p>Welcome to the Intelligent Fund cash-tropic app! </p>
      <p>Here you will be launching a dumpster into an orbit!</p>
      <p>
        This app is a fork of NextChat, developed by Illia Dorosh. You can find
        the source code on <a href={REPO_URL}>GitHub</a> and fork it to
        contribute.
      </p>
      <h2>Terms and Conditions (Zustimmung)</h2>
      <p>
        By using it you agree to some terms and conditions.<br></br>
        Русская версия активируется только в Москве, при триумфальной встрече с
        высшими лицами всей этой вакханалии
      </p>
      <h2>Privacy Policy (Datenschutzerklaerung)</h2>
      <p>
        We do store your data unless you agree. We use cookies to track your
        session and store your preferences. We do share your data with anyone.
      </p>
      <h2>Impressum</h2>
      <p>
        RiddleTiger Liubov Abdullina Cornerliusstr 1a 90455 Nuremberg Germany
      </p>

      <h2>AGB</h2>
      <link href="https://www.riddletiger.com/legal-details" />

      <div className={styles["sidebar-action"]}>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <IconButton icon={<GithubIcon />} shadow />
        </a>
      </div>
    </div>
  );
}

export default About;

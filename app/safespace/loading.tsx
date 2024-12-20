import React from "react";
import BotIcon from "@/app/icons/bot.svg";
import styles from "@/app/components/chat.module.scss";

function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}I am kinda loading...
    </div>
  );
}

export default Loading;

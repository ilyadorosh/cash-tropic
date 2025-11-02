import { Redis } from "@upstash/redis";
import React from "react";
import dynamic from "next/dynamic";
import styles from "@/app/components/chat.module.scss";

const ClipboardViewer = dynamic(
  () =>
    import("@/app/components/clipboard-viewer").then((mod) => ({
      default: mod.ClipboardViewer,
    })),
  { ssr: false },
);

export default async function ClipboardPage() {
  const kv = Redis.fromEnv();

  // Get clipboard history from Redis
  const clipboardHistory = await kv.lrange("clipboard:all", 0, 50);

  const formattedHistory = clipboardHistory
    .map((item) => {
      try {
        return typeof item === "string" ? JSON.parse(item) : item;
      } catch (error) {
        console.error("Failed to parse clipboard item:", item, error);
        return null;
      }
    })
    .filter(Boolean);

  return (
    <div className={styles.chat}>
      <div className="window-header" data-tauri-drag-region>
        <div className={`window-header-title ${styles["chat-body-title"]}`}>
          <div
            className={`window-header-main-title ${styles["chat-body-main-title"]}`}
          >
            📋 Clipboard Viewer
          </div>
          <div className="window-header-sub-title">
            Paste & Format with Full Chat Rendering
          </div>
        </div>
      </div>

      <div className={styles["chat-body"]}>
        <ClipboardViewer initialHistory={formattedHistory} />
      </div>
    </div>
  );
}

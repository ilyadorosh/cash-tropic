"use client";

import React, { useState, useRef, useCallback } from "react";
import { Markdown } from "./markdown";
import { copyToClipboard } from "../utils";
import CopyIcon from "../icons/copy.svg";
import DeleteIcon from "../icons/clear.svg";
import styles from "./clipboard.module.scss";

interface ClipboardItem {
  content: string;
  timestamp: number;
  id: string;
}

export function ClipboardViewer({
  initialHistory = [],
}: {
  initialHistory?: any[];
}) {
  const [clipboardContent, setClipboardContent] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [history, setHistory] = useState<ClipboardItem[]>(
    initialHistory.map((item, idx) => ({
      content: typeof item === "string" ? item : item.content,
      timestamp: item.timestamp || Date.now(),
      id: `${idx}-${Date.now()}`,
    })),
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fontSize = 14;

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") || "";

      if (text.trim().length > 0) {
        setClipboardContent(text);
        setIsEmpty(false);

        // Add to history
        const newItem: ClipboardItem = {
          content: text,
          timestamp: Date.now(),
          id: `clipboard-${Date.now()}`,
        };
        setHistory([newItem, ...history.slice(0, 49)]);

        // Save to Redis (client-side call to API)
        await fetch("/api/clipboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });
      }
    },
    [history],
  );

  const handleManualInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.currentTarget.value;
      setClipboardContent(text);
      setIsEmpty(text.trim().length === 0);
    },
    [],
  );

  const handleClear = useCallback(() => {
    setClipboardContent("");
    setIsEmpty(true);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleDeleteHistory = useCallback(
    (id: string) => {
      setHistory(history.filter((item) => item.id !== id));
    },
    [history],
  );

  return (
    <div className={styles["clipboard-container"]}>
      {/* Input Section */}
      <div className={styles["clipboard-input-section"]}>
        <label>📌 Paste or Type Content:</label>
        <textarea
          ref={inputRef}
          className={styles["clipboard-input"]}
          placeholder="Paste your text here... (supports Markdown, LaTeX, code blocks, mermaid diagrams)"
          onPaste={handlePaste}
          onChange={handleManualInput}
          rows={4}
        />
        <div className={styles["clipboard-controls"]}>
          <button
            onClick={() => copyToClipboard(clipboardContent)}
            disabled={isEmpty}
            className={styles["copy-btn"]}
            title="Copy formatted content"
          >
            <CopyIcon /> Copy
          </button>
          <button
            onClick={handleClear}
            disabled={isEmpty}
            className={styles["clear-btn"]}
            title="Clear textarea"
          >
            <DeleteIcon /> Clear
          </button>
        </div>
      </div>

      {/* Live Preview Section */}
      {!isEmpty && (
        <div className={styles["clipboard-preview-section"]}>
          <h3>✨ Formatted Preview:</h3>
          <div className={styles["clipboard-preview"]}>
            <Markdown content={clipboardContent} fontSize={fontSize} />
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className={styles["clipboard-history-section"]}>
          <h3>📜 Recent Pastes ({history.length})</h3>
          <div className={styles["clipboard-history"]}>
            {history.map((item, idx) => (
              <div key={item.id} className={styles["history-item"]}>
                <div className={styles["history-header"]}>
                  <span className={styles["history-time"]}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={styles["history-preview"]}>
                    {item.content.substring(0, 50)}...
                  </span>
                  <button
                    className={styles["history-delete"]}
                    onClick={() => handleDeleteHistory(item.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
                <div className={styles["history-content"]}>
                  <Markdown content={item.content} fontSize={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

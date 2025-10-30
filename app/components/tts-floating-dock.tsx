import React from "react";
import { showToast } from "./ui-lib";
import { TTS_LANG_KEY, DEFAULT_TTS_LANG } from "../constants/tts";

export function TTSFloatingDock() {
  const speakSelection = () => {
    const selection = window.getSelection()?.toString().trim();
    
    if (!selection) {
      showToast("No text selected");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(selection);
    const savedLang = localStorage.getItem(TTS_LANG_KEY) || DEFAULT_TTS_LANG;
    utterance.lang = savedLang;
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        display: "flex",
        gap: "8px",
        zIndex: 1000,
        backgroundColor: "var(--white)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        border: "1px solid var(--border-color)",
      }}
    >
      <button
        onClick={speakSelection}
        style={{
          padding: "8px 12px",
          fontSize: "14px",
          borderRadius: "6px",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--white)",
          color: "var(--black)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
        title="Speak selected text"
      >
        🔍🔊
      </button>
      <button
        onClick={stopSpeaking}
        style={{
          padding: "8px 12px",
          fontSize: "14px",
          borderRadius: "6px",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--white)",
          color: "var(--black)",
          cursor: "pointer",
        }}
        title="Stop speaking"
      >
        ⏹️
      </button>
    </div>
  );
}

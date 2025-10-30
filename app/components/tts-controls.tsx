import React, { useState, useEffect } from "react";
import styles from "./ui-lib.module.scss";
import { TTS_LANG_KEY, TTS_READ_SELECTION_KEY, DEFAULT_TTS_LANG } from "../constants/tts";

export function TTSControls() {
  const [language, setLanguage] = useState<string>(DEFAULT_TTS_LANG);
  const [readSelectionOnly, setReadSelectionOnly] = useState<boolean>(false);

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedLang = localStorage.getItem(TTS_LANG_KEY);
    const savedReadSelection = localStorage.getItem(TTS_READ_SELECTION_KEY);
    
    if (savedLang) {
      setLanguage(savedLang);
    }
    if (savedReadSelection) {
      setReadSelectionOnly(savedReadSelection === "true");
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    localStorage.setItem(TTS_LANG_KEY, newLang);
  };

  const handleReadSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setReadSelectionOnly(newValue);
    localStorage.setItem(TTS_READ_SELECTION_KEY, String(newValue));
  };

  return (
    <div className={styles["tts-controls"]} style={{ 
      padding: "10px", 
      borderBottom: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label style={{ fontSize: "12px", minWidth: "60px" }}>TTS Lang:</label>
        <select 
          value={language} 
          onChange={handleLanguageChange}
          style={{ 
            flex: 1,
            padding: "4px 8px",
            fontSize: "12px",
            borderRadius: "4px",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--white)",
            color: "var(--black)"
          }}
        >
          <option value="de-DE">🇩🇪 German</option>
          <option value="en-US">🇺🇸 English</option>
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="checkbox"
            checked={readSelectionOnly}
            onChange={handleReadSelectionChange}
          />
          Read selection only
        </label>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";

const TTS_LANG_KEY = "tts_lang";
const TTS_READ_KEY = "tts_read_selection";

export const TtsControls: React.FC = () => {
  const [lang, setLang] = useState<string>("de-DE");
  const [readSelectionOnly, setReadSelectionOnly] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(TTS_LANG_KEY);
      const storedRead = localStorage.getItem(TTS_READ_KEY);
      if (storedLang) setLang(storedLang);
      if (storedRead !== null) setReadSelectionOnly(storedRead === "true");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TTS_LANG_KEY, lang);
      localStorage.setItem(TTS_READ_KEY, String(readSelectionOnly));
    } catch {}
  }, [lang, readSelectionOnly]);

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "6px 0",
      }}
    >
      <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        TTS Language:
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label="TTS Language"
        >
          <option value="de-DE">Deutsch (de-DE)</option>
          <option value="en-US">English (en-US)</option>
        </select>
      </label>

      <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={readSelectionOnly}
          onChange={(e) => setReadSelectionOnly(e.target.checked)}
        />
        Read selection only
      </label>
    </div>
  );
};

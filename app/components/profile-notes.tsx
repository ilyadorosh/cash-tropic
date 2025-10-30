import React, { useState, useEffect } from "react";
import { showToast } from "./ui-lib";
import styles from "./ui-lib.module.scss";

const PROFILE_NOTES_KEY = "profile_notes";

export function ProfileNotes() {
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    // Load notes from localStorage on mount
    const savedNotes = localStorage.getItem(PROFILE_NOTES_KEY);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    localStorage.setItem(PROFILE_NOTES_KEY, newNotes);
  };

  const copyToClipboard = () => {
    if (!notes.trim()) {
      showToast("No notes to copy");
      return;
    }

    navigator.clipboard.writeText(notes).then(() => {
      showToast("Notes copied to clipboard");
    }).catch((err) => {
      console.error("Failed to copy:", err);
      showToast("Failed to copy notes");
    });
  };

  return (
    <div style={{ 
      padding: "10px",
      borderBottom: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: "4px"
      }}>
        <label style={{ fontSize: "12px", fontWeight: "bold" }}>
          Profile Notes
        </label>
        <button
          onClick={copyToClipboard}
          style={{
            padding: "4px 8px",
            fontSize: "11px",
            borderRadius: "4px",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--white)",
            color: "var(--black)",
            cursor: "pointer",
          }}
          title="Copy notes to clipboard"
        >
          📋 Copy
        </button>
      </div>
      <textarea
        value={notes}
        onChange={handleNotesChange}
        placeholder="Store personal context or profile notes here..."
        style={{
          width: "100%",
          minHeight: "80px",
          padding: "8px",
          fontSize: "12px",
          borderRadius: "4px",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--white)",
          color: "var(--black)",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

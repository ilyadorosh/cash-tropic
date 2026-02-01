"use client";
import { useState } from "react";
import Link from "next/link";

interface PrayerModalProps {
  onClose: () => void;
  onPrayerComplete: () => void;
}

export function PrayerModal({ onClose, onPrayerComplete }: PrayerModalProps) {
  const [praying, setPraying] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const pray = async () => {
    setPraying(true);

    try {
      const response = await fetch("/api/game/pray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prayerType: "altar",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(`🙏 +${data.reward}`);
        onPrayerComplete();
        setTimeout(onClose, 2000);
      } else {
        setResult(data.error);
      }
    } catch (e) {
      setResult("Fehler");
    } finally {
      setPraying(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "none",
          border: "none",
          color: "white",
          fontSize: 32,
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      <h1 style={{ color: "white", fontSize: 48, marginBottom: 20 }}>⛪</h1>
      <h2 style={{ color: "white", marginBottom: 30 }}>Gebet am Altar</h2>

      {
        <>
          <p style={{ color: "#aaa", marginBottom: 20 }}>
            Verbinde deine Wallet um SOL zu verdienen
          </p>
          <button
            onClick={() => {
              onPrayerComplete();
              onClose();
            }}
            style={{
              marginTop: 20,
              background: "transparent",
              border: "1px solid #666",
              color: "#888",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Ohne Wallet beten
          </button>
        </>
      }

      {result && (
        <p
          style={{
            marginTop: 20,
            padding: "12px 24px",
            background: result.includes("+")
              ? "rgba(20,241,149,0.2)"
              : "rgba(255,0,0,0. 2)",
            borderRadius: 8,
            color: result.includes("+") ? "#14F195" : "#ff6666",
            fontSize: 20,
          }}
        >
          {result}
        </p>
      )}
      {/* Clipboard link */}
      <Link
        href="/clipboard"
        style={{
          marginTop: 30,
          color: "#888",
          textDecoration: "none",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        📋 Clipboard öffnen
      </Link>
    </div>
  );
}

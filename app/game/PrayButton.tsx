"use client";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { user } from "../lib/schema";

export function PrayButton({
  onPrayerComplete,
}: {
  onPrayerComplete?: () => void;
}) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [praying, setPraying] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const pray = async () => {
    if (!publicKey) return;

    setPraying(true);
    setResult(null);

    try {
      const response = await fetch("/api/game/pray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          action: "prayer",
          timestamp: Date.now(),
          prayerType: "altar",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(`🙏 Gebet erhört! +${data.reward} SOL`);
        onPrayerComplete?.();
      } else {
        setResult(data.error || "Gebet fehlgeschlagen");
      }
    } catch (e) {
      setResult("Fehler beim Beten");
    } finally {
      setPraying(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      {!connected ? (
        <WalletMultiButton />
      ) : (
        <button
          onClick={pray}
          disabled={praying}
          style={{
            background: praying
              ? "#666"
              : "linear-gradient(135deg, #9945FF, #14F195)",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
            cursor: praying ? "wait" : "pointer",
          }}
        >
          {praying ? "🙏 Beten..." : "🙏 BETEN (+SOL)"}
        </button>
      )}

      {result && (
        <div
          style={{
            background: "rgba(0,0,0,0.8)",
            padding: "8px 16px",
            borderRadius: 8,
            color: result.includes("! ") ? "#14F195" : "#ff6666",
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}

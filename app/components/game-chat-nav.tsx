"use client";

import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store";
import styles from "./game-chat-nav.module.scss";

interface GameChatNavProps {
  onClose?: () => void;
}

interface Character {
  x: number;
  y: number;
  size: number;
}

interface ChatBox {
  x: number;
  y: number;
  width: number;
  height: number;
  chatIndex: number;
  label: string;
}

export function GameChatNav({ onClose }: GameChatNavProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatStore = useChatStore();
  const [character, setCharacter] = useState<Character>({
    x: 50,
    y: 50,
    size: 20,
  });

// The fix I am instructing the agent to implement:
const sessions = useChatStore((state) => state.sessions);
const currentSessionIndex = useChatStore((state) => state.currentSessionIndex);

  // Create chat boxes in a grid
  const chatBoxes: ChatBox[] = sessions.map((session, index) => {
    const cols = Math.ceil(Math.sqrt(sessions.length));
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      x: 100 + col * 120,
      y: 100 + row * 120,
      width: 100,
      height: 80,
      chatIndex: index,
      label: session.topic || `Chat ${index + 1}`,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "var(--gray)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw chat boxes
    chatBoxes.forEach((box) => {
      const isActive = box.chatIndex === currentSessionIndex;
      ctx.fillStyle = isActive ? "var(--primary)" : "var(--white)";
      ctx.fillRect(box.x, box.y, box.width, box.height);
      
      ctx.strokeStyle = "var(--border-in-light)";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Draw label
      ctx.fillStyle = "var(--black)";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const text = box.label.length > 15 ? box.label.substring(0, 12) + "..." : box.label;
      ctx.fillText(text, box.x + box.width / 2, box.y + box.height / 2);
    });

    // Draw character
    ctx.fillStyle = "#76B900";
    ctx.beginPath();
    ctx.arc(character.x, character.y, character.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw character eyes
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(character.x - 4, character.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(character.x + 4, character.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }, [character, chatBoxes, currentSessionIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 10;
      let newX = character.x;
      let newY = character.y;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newY -= speed;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newY += speed;
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newX -= speed;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newX += speed;
          break;
        default:
          return;
      }

      e.preventDefault();

      // Bounds checking
      const canvas = canvasRef.current;
      if (canvas) {
        newX = Math.max(character.size / 2, Math.min(canvas.width - character.size / 2, newX));
        newY = Math.max(character.size / 2, Math.min(canvas.height - character.size / 2, newY));
      }

      setCharacter({ ...character, x: newX, y: newY });

      // Check collision with chat boxes
      chatBoxes.forEach((box) => {
        if (
          newX > box.x &&
          newX < box.x + box.width &&
          newY > box.y &&
          newY < box.y + box.height
        ) {
          chatStore.selectSession(box.chatIndex);
          if (onClose) {
            setTimeout(() => onClose(), 300);
          }
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [character, chatBoxes, chatStore, onClose]);

  return (
    <div className={styles.gameContainer}>
      <div className={styles.header}>
        <h2>Navigate Chats with WASD or Arrow Keys</h2>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className={styles.gameCanvas}
      />
      <div className={styles.instructions}>
        <p>Use WASD or Arrow keys to move your character</p>
        <p>Walk into a chat box to select it</p>
        <p>Active chat is highlighted in green</p>
      </div>
    </div>
  );
}

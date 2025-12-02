"use client";
import { useState } from "react";

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onAction: (action: "interact" | "shoot" | "mission" | "brake") => void;
  showMissionButton?: boolean;
}

export function MobileControls({
  onMove,
  onAction,
  showMissionButton = true,
}: MobileControlsProps) {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

  const handleJoystickMove = (
    e: React.TouchEvent,
    baseX: number,
    baseY: number,
  ) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    const dx = (touch.clientX - baseX) / 50;
    const dy = (touch.clientY - baseY) / 50;
    const x = Math.max(-1, Math.min(1, dx));
    const y = Math.max(-1, Math.min(1, dy));
    setJoystickPos({ x: x * 20, y: y * 20 });
    onMove(x, -y); // Invert Y for forward/back
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "200px",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Left: Movement Joystick */}
      <div
        onTouchStart={(e) => {
          setJoystickActive(true);
          const rect = e.currentTarget.getBoundingClientRect();
          handleJoystickMove(
            e,
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
        }}
        onTouchMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          handleJoystickMove(
            e,
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
        }}
        onTouchEnd={() => {
          setJoystickActive(false);
          setJoystickPos({ x: 0, y: 0 });
          onMove(0, 0);
        }}
        style={{
          position: "absolute",
          left: 30,
          bottom: 30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          border: "3px solid rgba(255,255,255,0.4)",
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Joystick knob */}
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            transition: joystickActive ? "none" : "transform 0. 1s",
          }}
        />
      </div>

      {/* Right: Action Buttons */}
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "auto",
        }}
      >
        {/* Mission Overview Button */}
        {showMissionButton && (
          <button
            onClick={() => onAction("mission")}
            style={{
              ...buttonStyle,
              background: "rgba(255,200,0,0.4)",
              fontSize: 18,
            }}
          >
            📋
          </button>
        )}

        {/* Interact (E key) */}
        <button
          onClick={() => onAction("interact")}
          style={{
            ...buttonStyle,
            background: "rgba(0,150,255,0.4)",
          }}
        >
          E
        </button>

        {/* Shoot (F key) */}
        <button
          onClick={() => onAction("shoot")}
          style={{
            ...buttonStyle,
            background: "rgba(255,50,50,0.4)",
          }}
        >
          F
        </button>

        {/* Brake/Surrender (SPACE) */}
        <button
          onClick={() => onAction("brake")}
          style={{
            ...buttonStyle,
            width: 100,
            borderRadius: 10,
            background: "rgba(100,100,100,0.4)",
            fontSize: 12,
          }}
        >
          SPACE
        </button>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  borderRadius: "50%",
  border: "3px solid rgba(255,255,255,0.5)",
  color: "white",
  fontSize: 24,
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
};

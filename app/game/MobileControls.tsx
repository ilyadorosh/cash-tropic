"use client";
import React, { useCallback, useRef, useState, useEffect } from "react";

interface MobileControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onAction: (action: "interact" | "brake" | "mission" | "attack") => void;
  showMissionButton?: boolean;
}

export default function MobileControls({
  onMove,
  onAction,
  showMissionButton = true,
}: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [joystick, setJoystick] = useState({ active: false, x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          window.innerWidth < 900,
      );
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const computeNormalized = (
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (clientX - centerX) / (rect.width / 2);
    const y = (clientY - centerY) / (rect.height / 2);
    const mag = Math.sqrt(x * x + y * y);
    return { x: mag > 1 ? x / mag : x, y: mag > 1 ? y / mag : y };
  };

  const handleStart = useCallback(
    (e: TouchEvent | MouseEvent) => {
      const rect = joystickRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = (e as TouchEvent).touches
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent).clientX;
      const clientY = (e as TouchEvent).touches
        ? (e as TouchEvent).touches[0].clientY
        : (e as MouseEvent).clientY;
      const n = computeNormalized(clientX, clientY, rect);
      setJoystick({ active: true, x: n.x, y: n.y });
      onMove({ x: n.x, y: n.y });
    },
    [onMove],
  );

  const handleMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!joystick.active) return;
      const rect = joystickRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = (e as TouchEvent).touches
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent).clientX;
      const clientY = (e as TouchEvent).touches
        ? (e as TouchEvent).touches[0].clientY
        : (e as MouseEvent).clientY;
      const n = computeNormalized(clientX, clientY, rect);
      setJoystick({ active: true, x: n.x, y: n.y });
      onMove({ x: n.x, y: n.y });
    },
    [joystick.active, onMove],
  );

  const handleEnd = useCallback(() => {
    setJoystick({ active: false, x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  if (!isMobile) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 220,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <div
        ref={joystickRef}
        onTouchStart={(e) => handleStart(e.nativeEvent)}
        onTouchMove={(e) => handleMove(e.nativeEvent)}
        onTouchEnd={() => handleEnd()}
        onMouseDown={(e) => handleStart(e.nativeEvent)}
        onMouseMove={(e) => handleMove(e.nativeEvent)}
        onMouseUp={() => handleEnd()}
        onMouseLeave={() => handleEnd()}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(100,100,100,0.35)",
          border: "3px solid rgba(255,255,255,0.3)",
          pointerEvents: "auto",
          touchAction: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            left: `calc(50% - 25px + ${joystick.x * 32}px)`,
            top: `calc(50% - 25px + ${joystick.y * 32}px)`,
            transition: joystick.active ? "none" : "all 0.15s ease",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <ActionButton label="E" action="interact" onAction={onAction} />
          <ActionButton label="F" action="attack" onAction={onAction} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ActionButton label="SPACE" action="brake" onAction={onAction} wide />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {showMissionButton && (
            <ActionButton label="M" action="mission" onAction={onAction} />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  action,
  onAction,
  wide,
}: {
  label: string;
  action: "interact" | "brake" | "mission" | "attack";
  onAction: (a: any) => void;
  wide?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault();
        setPressed(true);
        onAction(action);
      }}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => {
        setPressed(true);
        onAction(action);
      }}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: wide ? 110 : 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: pressed
          ? "rgba(118,185,0,0.9)"
          : "rgba(100,100,100,0.6)",
        border: "2px solid rgba(255,255,255,0.4)",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

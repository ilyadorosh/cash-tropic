"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";

interface MobileControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onAction: (action: "interact" | "brake" | "mission" | "attack") => void;
}

interface JoystickState {
  active: boolean;
  x: number;
  y: number;
}

export default function MobileControls({
  onMove,
  onAction,
}: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystick, setJoystick] = useState<JoystickState>({
    active: false,
    x: 0,
    y: 0,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          window.innerWidth < 768,
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleJoystickStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      const rect = joystickRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = (clientX - centerX) / (rect.width / 2);
      const y = (clientY - centerY) / (rect.height / 2);

      const magnitude = Math.sqrt(x * x + y * y);
      const normalizedX = magnitude > 1 ? x / magnitude : x;
      const normalizedY = magnitude > 1 ? y / magnitude : y;

      setJoystick({ active: true, x: normalizedX, y: normalizedY });
      onMove({ x: normalizedX, y: normalizedY });
    },
    [onMove],
  );

  const handleJoystickMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!joystick.active) return;
      e.preventDefault();

      const rect = joystickRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = (clientX - centerX) / (rect.width / 2);
      const y = (clientY - centerY) / (rect.height / 2);

      const magnitude = Math.sqrt(x * x + y * y);
      const normalizedX = magnitude > 1 ? x / magnitude : x;
      const normalizedY = magnitude > 1 ? y / magnitude : y;

      setJoystick((prev) => ({ ...prev, x: normalizedX, y: normalizedY }));
      onMove({ x: normalizedX, y: normalizedY });
    },
    [joystick.active, onMove],
  );

  const handleJoystickEnd = useCallback(() => {
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
        height: "200px",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {/* Virtual Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onMouseDown={handleJoystickStart}
        onMouseMove={handleJoystickMove}
        onMouseUp={handleJoystickEnd}
        onMouseLeave={handleJoystickEnd}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          backgroundColor: "rgba(100, 100, 100, 0.4)",
          border: "3px solid rgba(255, 255, 255, 0.5)",
          pointerEvents: "auto",
          touchAction: "none",
        }}
      >
        {/* Joystick Knob */}
        <div
          style={{
            position: "absolute",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            left: `calc(50% - 25px + ${joystick.x * 35}px)`,
            top: `calc(50% - 25px + ${joystick.y * 35}px)`,
            transition: joystick.active ? "none" : "all 0.2s ease",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* Action Buttons */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <ActionButton label="E" action="interact" onAction={onAction} />
          <ActionButton label="F" action="attack" onAction={onAction} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <ActionButton label="SPACE" action="brake" onAction={onAction} wide />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <ActionButton label="M" action="mission" onAction={onAction} />
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  action: "interact" | "brake" | "mission" | "attack";
  onAction: (action: "interact" | "brake" | "mission" | "attack") => void;
  wide?: boolean;
}

function ActionButton({ label, action, onAction, wide }: ActionButtonProps) {
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
        width: wide ? "110px" : "50px",
        height: "50px",
        borderRadius: "10px",
        backgroundColor: pressed
          ? "rgba(118, 185, 0, 0.9)"
          : "rgba(100, 100, 100, 0.6)",
        border: "2px solid rgba(255, 255, 255, 0.5)",
        color: "white",
        fontSize: wide ? "12px" : "16px",
        fontWeight: "bold",
        cursor: "pointer",
        touchAction: "manipulation",
        transition: "background-color 0.1s",
      }}
    >
      {label}
    </button>
  );
}

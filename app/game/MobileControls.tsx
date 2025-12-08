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

export default function MobileControls({ onMove, onAction }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystick, setJoystick] = useState<JoystickState>({ active: false, x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleJoystickStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setJoystick({ active: true, x: clientX - rect.left - 40, y: clientY - rect.top - 40 });
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!joystick.active) return;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    let dx = clientX - rect.left - 40;
    let dy = clientY - rect.top - 40;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 40) {
      dx = (dx / dist) * 40;
      dy = (dy / dist) * 40;
    }
    setJoystick((j) => ({ ...j, x: dx, y: dy }));
    onMove({ x: dx / 40, y: dy / 40 });
  }, [joystick.active, onMove]);

  const handleJoystickEnd = useCallback(() => {
    setJoystick({ active: false, x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  if (!isMobile) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 100 }}>
      <div
        ref={joystickRef}
        style={{ width: 80, height: 80, background: "rgba(0,0,0,0.3)", borderRadius: 40, position: "relative", touchAction: "none" }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onMouseDown={handleJoystickStart}
        onMouseMove={joystick.active ? handleJoystickMove : undefined}
        onMouseUp={handleJoystickEnd}
      >
        <div
          style={{
            position: "absolute",
            left: 40 + joystick.x - 20,
            top: 40 + joystick.y - 20,
            width: 40,
            height: 40,
            background: "#76b900",
            borderRadius: 20,
            opacity: 0.8,
            pointerEvents: "none",
            transition: joystick.active ? "none" : "all 0.2s",
          }}
        />
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button onClick={() => onAction("interact")}>Interact</button>
        <button onClick={() => onAction("brake")}>Brake</button>
        <button onClick={() => onAction("mission")}>Mission</button>
        <button onClick={() => onAction("attack")}>Attack</button>
      </div>
    </div>
  );
}
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

export default function MobileControls({ onMove, onAction }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystick, setJoystick] = useState<JoystickState>({ active: false, x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleJoystickStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setJoystick({ active: true, x: clientX - rect.left - 40, y: clientY - rect.top - 40 });
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!joystick.active) return;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    let dx = clientX - rect.left - 40;
    let dy = clientY - rect.top - 40;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 40) {
      dx = (dx / dist) * 40;
      dy = (dy / dist) * 40;
    }
    setJoystick((j) => ({ ...j, x: dx, y: dy }));
    onMove({ x: dx / 40, y: dy / 40 });
  }, [joystick.active, onMove]);

  const handleJoystickEnd = useCallback(() => {
    setJoystick({ active: false, x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  if (!isMobile) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 100 }}>
      <div
        ref={joystickRef}
        style={{ width: 80, height: 80, background: "rgba(0,0,0,0.3)", borderRadius: 40, position: "relative", touchAction: "none" }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onMouseDown={handleJoystickStart}
        onMouseMove={joystick.active ? handleJoystickMove : undefined}
        onMouseUp={handleJoystickEnd}
      >
        <div
          style={{
            position: "absolute",
            left: 40 + joystick.x - 20,
            top: 40 + joystick.y - 20,
            width: 40,
            height: 40,
            background: "#76b900",
            borderRadius: 20,
            opacity: 0.8,
            pointerEvents: "none",
            transition: joystick.active ? "none" : "all 0.2s",
          }}
        />
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button onClick={() => onAction("interact")}>Interact</button>
        <button onClick={() => onAction("brake")}>Brake</button>
        <button onClick={() => onAction("mission")}>Mission</button>
        <button onClick={() => onAction("attack")}>Attack</button>
      </div>
    </div>
  );
}

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
>>>>>>> copilot/add-map-editor-page

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "200px",
        pointerEvents: "none",
<<<<<<< HEAD
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
>>>>>>> copilot/add-map-editor-page
          }}
        />
      </div>

<<<<<<< HEAD
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
=======
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
>>>>>>> copilot/add-map-editor-page
      </div>
    </div>
  );
}

<<<<<<< HEAD
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
=======
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
>>>>>>> copilot/add-map-editor-page

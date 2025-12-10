"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Shadow World - Understanding projection through play
 *
 * A 3D world projected onto 2D (like shadows on a wall)
 * Move in 3D, but you only see the 2D shadow
 *
 * This is the simplest demonstration of dimensional projection:
 * - 3D objects cast 2D shadows
 * - You control a 3D position but see the 2D result
 * - Depth (the projected-away dimension) affects shadow SIZE
 */

interface Object3D {
  x: number;
  y: number;
  z: number; // Depth - this gets "compressed" in projection
  size: number;
  color: string;
  type: "sphere" | "cube" | "player";
}

export default function ShadowWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"shadow" | "topdown" | "both">("both");

  // Player position in 3D
  const playerRef = useRef({ x: 200, y: 300, z: 50 });
  const keysRef = useRef<Record<string, boolean>>({});

  // 3D objects in the world
  const objectsRef = useRef<Object3D[]>([
    { x: 100, y: 200, z: 30, size: 20, color: "#ff6644", type: "sphere" },
    { x: 300, y: 150, z: 80, size: 25, color: "#44ff66", type: "cube" },
    { x: 250, y: 350, z: 20, size: 15, color: "#6644ff", type: "sphere" },
    { x: 150, y: 280, z: 100, size: 30, color: "#ffff44", type: "cube" },
    { x: 350, y: 250, z: 60, size: 18, color: "#ff44ff", type: "sphere" },
    { x: 200, y: 100, z: 40, size: 22, color: "#44ffff", type: "cube" },
  ]);

  // Light source position (affects shadow projection)
  const lightRef = useRef({ x: 200, y: -100, z: 200 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Project 3D point to 2D shadow position
    // The further from light (higher z relative to light), the larger/more spread the shadow
    const projectToShadow = (obj: Object3D, groundZ: number = 0) => {
      const light = lightRef.current;

      // Ray from light through object to ground plane (z=0)
      // Similar triangles: shadow_offset / light_height = obj_offset / (light_height - obj_z)
      const lightHeight = light.z;
      const objHeight = obj.z;

      if (objHeight >= lightHeight) {
        // Object at or above light - no shadow (or infinite)
        return { x: obj.x, y: obj.y, scale: 0.1 };
      }

      const t = lightHeight / (lightHeight - objHeight);
      const shadowX = light.x + (obj.x - light.x) * t;
      const shadowY = light.y + (obj.y - light.y) * t;

      // Shadow size scales with distance from light
      const scale = t;

      return { x: shadowX, y: shadowY, scale: Math.min(scale, 3) };
    };

    // Handle keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Animation loop
    let animId: number;
    const animate = () => {
      const keys = keysRef.current;
      const player = playerRef.current;
      const speed = 3;

      // WASD for X/Y movement
      if (keys["w"] || keys["arrowup"]) player.y -= speed;
      if (keys["s"] || keys["arrowdown"]) player.y += speed;
      if (keys["a"] || keys["arrowleft"]) player.x -= speed;
      if (keys["d"] || keys["arrowright"]) player.x += speed;

      // Q/E for Z movement (the dimension that gets projected away!)
      if (keys["q"]) player.z = Math.max(5, player.z - speed);
      if (keys["e"]) player.z = Math.min(150, player.z + speed);

      // Keep in bounds
      player.x = Math.max(20, Math.min(380, player.x));
      player.y = Math.max(20, Math.min(380, player.y));

      // Clear
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const halfWidth = canvas.width / 2;

      if (mode === "both" || mode === "shadow") {
        // === LEFT: SHADOW VIEW (2D projection of 3D) ===
        const shadowOffsetX = mode === "both" ? 0 : halfWidth / 2;

        // Ground plane
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(shadowOffsetX, 0, halfWidth, canvas.height);

        // Title
        ctx.fillStyle = "#666";
        ctx.font = "12px monospace";
        ctx.fillText("2D SHADOW (projection of 3D)", shadowOffsetX + 10, 20);
        ctx.fillText(
          "You only see X,Y - Z is compressed into SIZE",
          shadowOffsetX + 10,
          35,
        );

        // Draw shadows of all objects (sorted by z for proper layering)
        const allObjects = [
          ...objectsRef.current,
          {
            ...player,
            size: 15,
            color: "#ff2200",
            type: "player" as const,
          },
        ];

        allObjects.sort((a, b) => b.z - a.z); // Far objects first

        allObjects.forEach((obj) => {
          const shadow = projectToShadow(obj);
          const shadowSize = obj.size * shadow.scale;

          // Shadow is darker and blurrier the further from ground
          const blur = Math.min(obj.z / 10, 10);
          const alpha = Math.max(0.3, 1 - obj.z / 200);

          ctx.save();
          ctx.globalAlpha = alpha;

          // Shadow
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.ellipse(
            shadowOffsetX + shadow.x,
            shadow.y,
            shadowSize,
            shadowSize * 0.6, // Flattened
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // Colored center (to identify object)
          ctx.fillStyle = obj.color;
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(
            shadowOffsetX + shadow.x,
            shadow.y,
            shadowSize * 0.3,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          ctx.restore();
        });

        // Light source indicator
        const lightShadow = { x: lightRef.current.x, y: lightRef.current.y };
        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(
          shadowOffsetX + lightShadow.x,
          lightShadow.y,
          8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "10px monospace";
        ctx.fillText(
          "LIGHT",
          shadowOffsetX + lightShadow.x - 15,
          lightShadow.y - 12,
        );
      }

      if (mode === "both" || mode === "topdown") {
        // === RIGHT: TOP-DOWN 3D VIEW (for reference) ===
        const topOffsetX = mode === "both" ? halfWidth : halfWidth / 2;

        // Background
        ctx.fillStyle = "#0a1628";
        ctx.fillRect(topOffsetX, 0, halfWidth, canvas.height);

        // Title
        ctx.fillStyle = "#666";
        ctx.font = "12px monospace";
        ctx.fillText("3D REFERENCE (X,Y,Z)", topOffsetX + 10, 20);
        ctx.fillText("Z shown as vertical offset + size", topOffsetX + 10, 35);

        // Grid
        ctx.strokeStyle = "#223";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 400; i += 50) {
          ctx.beginPath();
          ctx.moveTo(topOffsetX + i, 0);
          ctx.lineTo(topOffsetX + i, canvas.height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(topOffsetX, i);
          ctx.lineTo(topOffsetX + halfWidth, i);
          ctx.stroke();
        }

        // Draw objects with Z shown as vertical offset and size
        const allObjects = [
          ...objectsRef.current,
          {
            ...player,
            size: 15,
            color: "#ff2200",
            type: "player" as const,
          },
        ];

        allObjects.sort((a, b) => a.z - b.z); // Near objects last (on top)

        allObjects.forEach((obj) => {
          const zOffset = obj.z * 0.3; // Z lifts objects up visually
          const sizeBoost = 1 + obj.z / 100;

          // Ground shadow
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.ellipse(
            topOffsetX + obj.x,
            obj.y + 5,
            obj.size * 0.8,
            obj.size * 0.3,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // Object
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(
            topOffsetX + obj.x,
            obj.y - zOffset,
            obj.size * sizeBoost,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // Z indicator line
          ctx.strokeStyle = obj.color;
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.moveTo(topOffsetX + obj.x, obj.y);
          ctx.lineTo(topOffsetX + obj.x, obj.y - zOffset);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Z label
          if (obj.type === "player") {
            ctx.fillStyle = "#fff";
            ctx.font = "10px monospace";
            ctx.fillText(
              `Z: ${obj.z.toFixed(0)}`,
              topOffsetX + obj.x + 15,
              obj.y - zOffset,
            );
          }
        });

        // Light source
        const light = lightRef.current;
        const lightZOffset = light.z * 0.3;
        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(
          topOffsetX + light.x,
          light.y - lightZOffset,
          10,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.strokeStyle = "#ffff00";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(topOffsetX + light.x, light.y);
        ctx.lineTo(topOffsetX + light.x, light.y - lightZOffset);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Divider
      if (mode === "both") {
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(halfWidth, 0);
        ctx.lineTo(halfWidth, canvas.height);
        ctx.stroke();
      }

      // HUD
      ctx.fillStyle = "#0ff";
      ctx.font = "14px monospace";
      ctx.fillText(
        `Player: X=${player.x.toFixed(0)} Y=${player.y.toFixed(
          0,
        )} Z=${player.z.toFixed(0)}`,
        10,
        canvas.height - 40,
      );
      ctx.fillStyle = "#888";
      ctx.font = "12px monospace";
      ctx.fillText(
        "WASD=Move(X,Y)  Q/E=Up/Down(Z)  1/2/3=View Mode",
        10,
        canvas.height - 20,
      );

      animId = requestAnimationFrame(animate);
    };

    // Mode switching
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "1") setMode("shadow");
      if (e.key === "2") setMode("topdown");
      if (e.key === "3") setMode("both");
    };
    window.addEventListener("keydown", handleKey);

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKey);
    };
  }, [mode]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ color: "#0ff", marginBottom: 10 }}>Shadow World</h1>
      <p
        style={{
          color: "#666",
          marginBottom: 20,
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        3D → 2D projection. You exist in 3D but only see 2D shadows.
        <br />
        Move in Z (Q/E) and watch how shadows change size and position.
        <br />
        <strong>
          Projection compresses one dimension into another property (size).
        </strong>
      </p>

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        style={{
          border: "2px solid #333",
          borderRadius: 8,
        }}
      />

      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 10,
        }}
      >
        <button
          onClick={() => setMode("shadow")}
          style={{
            padding: "8px 16px",
            background: mode === "shadow" ? "#0ff" : "#333",
            color: mode === "shadow" ? "#000" : "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          1: Shadow Only
        </button>
        <button
          onClick={() => setMode("topdown")}
          style={{
            padding: "8px 16px",
            background: mode === "topdown" ? "#0ff" : "#333",
            color: mode === "topdown" ? "#000" : "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          2: 3D Reference
        </button>
        <button
          onClick={() => setMode("both")}
          style={{
            padding: "8px 16px",
            background: mode === "both" ? "#0ff" : "#333",
            color: mode === "both" ? "#000" : "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          3: Both
        </button>
      </div>

      <div
        style={{
          marginTop: 30,
          color: "#555",
          fontSize: 12,
          maxWidth: 600,
          textAlign: "center",
        }}
      >
        <p>
          <strong>The insight:</strong> When you project 3D→2D, the Z dimension
          doesn&#039;t disappear - it becomes encoded in other properties
          (shadow size, blur, position offset).
        </p>
        <p>This is information compression, not information loss.</p>
        <p>The same principle applies to 4D→3D, or any N→(N-1) projection.</p>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Flatland - 2D world projected to 1D
 *
 * The simplest possible projection demo.
 * You exist in 2D but only see a 1D line.
 * Like being a creature that can only see left/right, not up/down.
 *
 * Inspired by Edwin Abbott's "Flatland" (1884)
 */

interface Object2D {
  x: number;
  y: number; // This dimension gets projected away
  size: number;
  color: string;
  shape: "circle" | "square" | "triangle";
}

export default function Flatland() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Player position in 2D
  const playerRef = useRef({ x: 300, y: 200, angle: 0 });
  const keysRef = useRef<Record<string, boolean>>({});

  // 2D objects
  const objectsRef = useRef<Object2D[]>([
    { x: 150, y: 100, size: 30, color: "#ff4444", shape: "circle" },
    { x: 450, y: 150, size: 40, color: "#44ff44", shape: "square" },
    { x: 200, y: 350, size: 25, color: "#4444ff", shape: "triangle" },
    { x: 400, y: 300, size: 35, color: "#ffff44", shape: "circle" },
    { x: 100, y: 250, size: 20, color: "#ff44ff", shape: "square" },
    { x: 500, y: 350, size: 30, color: "#44ffff", shape: "triangle" },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animId: number;

    const animate = () => {
      const keys = keysRef.current;
      const player = playerRef.current;
      const speed = 3;
      const turnSpeed = 0.05;

      // A/D to turn (change view angle)
      if (keys["a"] || keys["arrowleft"]) player.angle -= turnSpeed;
      if (keys["d"] || keys["arrowright"]) player.angle += turnSpeed;

      // W/S to move forward/backward in facing direction
      if (keys["w"] || keys["arrowup"]) {
        player.x += Math.cos(player.angle) * speed;
        player.y += Math.sin(player.angle) * speed;
      }
      if (keys["s"] || keys["arrowdown"]) {
        player.x -= Math.cos(player.angle) * speed;
        player.y -= Math.sin(player.angle) * speed;
      }

      // Q/E to strafe
      if (keys["q"]) {
        player.x += Math.cos(player.angle - Math.PI / 2) * speed;
        player.y += Math.sin(player.angle - Math.PI / 2) * speed;
      }
      if (keys["e"]) {
        player.x += Math.cos(player.angle + Math.PI / 2) * speed;
        player.y += Math.sin(player.angle + Math.PI / 2) * speed;
      }

      // Bounds
      player.x = Math.max(20, Math.min(580, player.x));
      player.y = Math.max(20, Math.min(380, player.y));

      // Clear
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // === TOP: 1D VIEW (projection of 2D) ===
      const view1DHeight = 150;
      const view1DY = 30;

      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, view1DY, canvas.width, view1DHeight);

      // Title
      ctx.fillStyle = "#666";
      ctx.font = "12px monospace";
      ctx.fillText(
        "1D VIEW - What a Flatlander sees (Y compressed into SIZE)",
        10,
        20,
      );

      // Project each object to 1D
      // Only objects in front of player (within FOV) are visible
      const fov = Math.PI * 0.8; // 144 degree field of view

      interface Projection1D {
        screenX: number; // Position on 1D line
        apparentSize: number; // Size (from distance)
        distance: number; // For sorting
        color: string;
        shape: string;
      }

      const projections: Projection1D[] = [];

      objectsRef.current.forEach((obj) => {
        // Vector from player to object
        const dx = obj.x - player.x;
        const dy = obj.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Angle to object
        const angleToObj = Math.atan2(dy, dx);

        // Relative angle (from player's facing direction)
        let relAngle = angleToObj - player.angle;

        // Normalize to -PI to PI
        while (relAngle > Math.PI) relAngle -= Math.PI * 2;
        while (relAngle < -Math.PI) relAngle += Math.PI * 2;

        // Check if in FOV
        if (Math.abs(relAngle) < fov / 2) {
          // Project to 1D screen position
          const screenX =
            canvas.width / 2 + (relAngle / (fov / 2)) * (canvas.width / 2 - 50);

          // Size inversely proportional to distance (perspective)
          const apparentSize = (obj.size * 200) / Math.max(distance, 30);

          projections.push({
            screenX,
            apparentSize: Math.min(apparentSize, view1DHeight * 0.9),
            distance,
            color: obj.color,
            shape: obj.shape,
          });
        }
      });

      // Sort by distance (far first)
      projections.sort((a, b) => b.distance - a.distance);

      // Draw 1D projections
      const centerY1D = view1DY + view1DHeight / 2;

      projections.forEach((proj) => {
        const halfSize = proj.apparentSize / 2;

        // Draw as colored bar (the "1D" representation)
        ctx.fillStyle = proj.color;
        ctx.fillRect(
          proj.screenX - 5,
          centerY1D - halfSize,
          10,
          proj.apparentSize,
        );

        // Shape indicator
        ctx.fillStyle = "#fff";
        ctx.font = "8px monospace";
        ctx.fillText(proj.shape[0].toUpperCase(), proj.screenX - 3, centerY1D);
      });

      // Center line (player position in 1D)
      ctx.strokeStyle = "#ff2200";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, view1DY);
      ctx.lineTo(canvas.width / 2, view1DY + view1DHeight);
      ctx.stroke();

      // === BOTTOM: 2D MAP (reference) ===
      const map2DY = view1DY + view1DHeight + 30;
      const map2DHeight = canvas.height - map2DY - 10;

      ctx.fillStyle = "#0a1628";
      ctx.fillRect(0, map2DY, canvas.width, map2DHeight);

      ctx.fillStyle = "#666";
      ctx.font = "12px monospace";
      ctx.fillText(
        "2D MAP - The actual world (you are the red triangle)",
        10,
        map2DY + 15,
      );

      // Grid
      ctx.strokeStyle = "#223";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 600; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, map2DY);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = map2DY; i <= canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw FOV cone
      ctx.fillStyle = "rgba(255, 255, 0, 0.1)";
      ctx.beginPath();
      ctx.moveTo(player.x, map2DY + (player.y * map2DHeight) / 400);
      const fovDist = 300;
      ctx.lineTo(
        player.x + Math.cos(player.angle - fov / 2) * fovDist,
        map2DY +
          ((player.y + Math.sin(player.angle - fov / 2) * fovDist) *
            map2DHeight) /
            400,
      );
      ctx.lineTo(
        player.x + Math.cos(player.angle + fov / 2) * fovDist,
        map2DY +
          ((player.y + Math.sin(player.angle + fov / 2) * fovDist) *
            map2DHeight) /
            400,
      );
      ctx.closePath();
      ctx.fill();

      // Draw objects on 2D map
      objectsRef.current.forEach((obj) => {
        const mapY = map2DY + (obj.y * map2DHeight) / 400;

        ctx.fillStyle = obj.color;
        if (obj.shape === "circle") {
          ctx.beginPath();
          ctx.arc(obj.x, mapY, obj.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (obj.shape === "square") {
          ctx.fillRect(
            obj.x - obj.size * 0.4,
            mapY - obj.size * 0.4,
            obj.size * 0.8,
            obj.size * 0.8,
          );
        } else {
          ctx.beginPath();
          ctx.moveTo(obj.x, mapY - obj.size * 0.5);
          ctx.lineTo(obj.x - obj.size * 0.4, mapY + obj.size * 0.4);
          ctx.lineTo(obj.x + obj.size * 0.4, mapY + obj.size * 0.4);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Draw player on 2D map
      const playerMapY = map2DY + (player.y * map2DHeight) / 400;
      ctx.save();
      ctx.translate(player.x, playerMapY);
      ctx.rotate(player.angle);

      ctx.fillStyle = "#ff2200";
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // HUD
      ctx.fillStyle = "#0ff";
      ctx.font = "14px monospace";
      ctx.fillText(
        `Position: X=${player.x.toFixed(0)} Y=${player.y.toFixed(0)}  Angle=${(
          (player.angle * 180) /
          Math.PI
        ).toFixed(0)}°`,
        10,
        canvas.height - 10,
      );

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

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
        padding: 20,
      }}
    >
      <h1 style={{ color: "#0ff", marginBottom: 10 }}>Flatland</h1>
      <p
        style={{
          color: "#666",
          marginBottom: 15,
          textAlign: "center",
          maxWidth: 700,
        }}
      >
        2D → 1D projection. You exist in 2D but only see a 1D line.
        <br />
        <strong>The Y dimension is compressed into the SIZE of objects.</strong>
        <br />
        Turn (A/D) to see objects slide across your 1D view.
      </p>

      <canvas
        ref={canvasRef}
        width={600}
        height={450}
        style={{
          border: "2px solid #333",
          borderRadius: 8,
        }}
      />

      <div
        style={{
          marginTop: 15,
          color: "#888",
          fontSize: 12,
          display: "flex",
          gap: 30,
        }}
      >
        <span>W/S: Move forward/back</span>
        <span>A/D: Turn left/right</span>
        <span>Q/E: Strafe</span>
      </div>

      <div
        style={{
          marginTop: 20,
          color: "#555",
          fontSize: 12,
          maxWidth: 600,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        <p>
          <strong>The insight:</strong> A 2D creature (Flatlander) looking at a
          2D world only sees a 1D slice - a line of colors. The second dimension
          (depth/Y) becomes encoded as <em>apparent size</em>.
        </p>
        <p>
          This is exactly how our 3D eyes work - we see a 2D projection of 3D,
          with depth encoded as size, occlusion, and parallax.
        </p>
        <p>And it&#039;s how 4D→3D projection works too.</p>
      </div>
    </div>
  );
}

// components/CryoMooreChart.tsx
"use client"; // <-- forces client‑only execution (App Router)

import { useEffect, useRef, useState } from "react";
import { cryoTemps, mooreValues, Point } from "@/data/cryonics";

type Tooltip = {
  x: number; // canvas pixel
  y: number;
  year: number;
  temp: number;
  moore: number;
} | null;

export default function CryoMooreChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip>(null);

  // -----------------------------------------------------------------
  // 1️⃣ Helper: size canvas for devicePixelRatio
  // -----------------------------------------------------------------
  const resizeCanvas = (canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  };

  // -----------------------------------------------------------------
  // 2️⃣ Helper: map data → pixel coordinates
  // -----------------------------------------------------------------
  const getScales = (
    width: number,
    height: number,
    padding = { left: 60, right: 20, top: 20, bottom: 40 },
  ) => {
    // X‑axis: years 0‑75 (1950‑2025)
    const xMin = 0,
      xMax = 75;
    const xScale = (x: number) =>
      padding.left +
      ((x - xMin) / (xMax - xMin)) * (width - padding.left - padding.right);

    // Y‑axis left: temperature (°C) – from +30 to -220
    const tMin = -220,
      tMax = 30;
    const yTempScale = (t: number) =>
      padding.top +
      ((tMax - t) / (tMax - tMin)) * (height - padding.top - padding.bottom);

    // Y‑axis right: Moore value – we use a log‑scale for readability
    const mMin = 1,
      mMax = Math.pow(2, 75 / 2); // value at year 75
    const yMooreScale = (m: number) =>
      padding.top +
      ((Math.log10(mMax) - Math.log10(m)) /
        (Math.log10(mMax) - Math.log10(mMin))) *
        (height - padding.top - padding.bottom);

    return { xScale, yTempScale, yMooreScale, padding };
  };

  // -----------------------------------------------------------------
  // 3️⃣ Helper: draw a line given points and a scaling fn
  // -----------------------------------------------------------------
  const drawLine = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    xFn: (x: number) => number,
    yFn: (y: number) => number,
    style: { stroke: string; width: number; dash?: number[] },
  ) => {
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xFn(p.year);
      const y = yFn(p.temp);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.width;
    if (style.dash) ctx.setLineDash(style.dash);
    ctx.stroke();
    ctx.restore();
  };

  // -----------------------------------------------------------------
  // 4️⃣ Main drawing routine (runs once + on resize)
  // -----------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      resizeCanvas(canvas);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = canvas.getBoundingClientRect();
      const { xScale, yTempScale, yMooreScale, padding } = getScales(
        width,
        height,
      );

      // ---- Clear background -------------------------------------------------
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);

      // ---- Axes --------------------------------------------------------------
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // X‑axis
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      // Y‑axis left
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, height - padding.bottom);
      // Y‑axis right
      ctx.moveTo(width - padding.right, padding.top);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();

      // ---- Grid & tick labels ------------------------------------------------
      const drawTicks = (
        scaleFn: (v: number) => number,
        values: number[],
        isY: boolean,
        labelFn: (v: number) => string,
        align: CanvasTextAlign,
        baseline: CanvasTextBaseline,
      ) => {
        ctx.fillStyle = "#666";
        ctx.font = "11px sans-serif";
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        values.forEach((v) => {
          const pos = scaleFn(v);
          if (isY) {
            // horizontal grid line
            ctx.beginPath();
            ctx.moveTo(padding.left, pos);
            ctx.lineTo(width - padding.right, pos);
            ctx.strokeStyle = "#e0e0e0";
            ctx.stroke();

            ctx.fillStyle = "#333";
            ctx.fillText(labelFn(v), padding.left - 6, pos);
          } else {
            // vertical grid line
            ctx.beginPath();
            ctx.moveTo(pos, padding.top);
            ctx.lineTo(pos, height - padding.bottom);
            ctx.strokeStyle = "#e0e0e0";
            ctx.stroke();

            ctx.fillStyle = "#333";
            ctx.fillText(labelFn(v), pos, height - padding.bottom + 14);
          }
        });
      };

      // X‑ticks (every 10 years)
      drawTicks(
        xScale,
        [0, 10, 20, 30, 40, 50, 60, 70],
        false,
        (y) => `${1950 + y}`,
        "center",
        "top",
      );

      // Y‑ticks left (temperature)
      drawTicks(
        yTempScale,
        [-200, -150, -100, -50, 0, 20, 30],
        true,
        (t) => `${t}°C`,
        "right",
        "middle",
      );

      // Y‑ticks right (Moore, log‑scale)
      const mooreTickVals = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000];
      drawTicks(
        yMooreScale,
        mooreTickVals,
        true,
        (v) => `${v.toLocaleString()}`,
        "left",
        "middle",
      );

      // ---- Plot the two series ------------------------------------------------
      // Cryonics temperature (solid red line)
      drawLine(ctx, cryoTemps, xScale, yTempScale, {
        stroke: "#d32f2f",
        width: 2,
      });

      // Moore’s law (blue dashed line, plotted on right axis)
      drawLine(ctx, mooreValues, xScale, yMooreScale, {
        stroke: "#1976d2",
        width: 2,
        dash: [6, 4],
      });

      // ---- Legend -------------------------------------------------------------
      const legendX = width - padding.right - 150;
      const legendY = padding.top + 10;
      ctx.font = "12px sans-serif";
      // Red line legend
      ctx.strokeStyle = "#d32f2f";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 30, legendY);
      ctx.stroke();
      ctx.fillStyle = "#333";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Cryonics Temp (°C)", legendX + 35, legendY);
      // Blue dashed legend
      ctx.strokeStyle = "#1976d2";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + 20);
      ctx.lineTo(legendX + 30, legendY + 20);
      ctx.stroke();
      ctx.fillText("Moore‑Law (performance)", legendX + 35, legendY + 20);
    };

    // Initial draw
    draw();

    // -----------------------------------------------------------------
    // 5️⃣ Resize handling (ResizeObserver is the most reliable)
    // -----------------------------------------------------------------
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []); // ← empty deps → run once on client

  // -----------------------------------------------------------------
  // 6️⃣ Tooltip – simple nearest‑point lookup on mouse move
  // -----------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    const { xScale, yTempScale, yMooreScale } = getScales(width, height);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert mouseX → year (inverse of xScale)
      const year = Math.round(
        ((mouseX - 60) / (width - 60 - 20)) * 75, // 60/20 = left/right padding
      );

      // Clamp to data range
      if (year < 0 || year > 75) {
        setTooltip(null);
        return;
      }

      // Find nearest temperature point (linear interpolation)
      const interp = (points: Point[], yr: number) => {
        // Find two surrounding points
        let before = points[0];
        let after = points[points.length - 1];
        for (let i = 0; i < points.length - 1; i++) {
          if (points[i].year <= yr && points[i + 1].year >= yr) {
            before = points[i];
            after = points[i + 1];
            break;
          }
        }
        const t = (yr - before.year) / (after.year - before.year);
        return before.temp + t * (after.temp - before.temp);
      };

      const temp = interp(cryoTemps, year);
      const moore = interp(mooreValues, year);

      setTooltip({
        x: mouseX,
        y: mouseY,
        year,
        temp,
        moore,
      });
    };

    const handleMouseLeave = () => setTooltip(null);

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // -----------------------------------------------------------------
  // 7️⃣ Render the canvas + tooltip overlay
  // -----------------------------------------------------------------
  return (
    <div style={{ position: "relative", width: "100%", height: "500px" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "#fff",
        }}
      />
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 4,
            pointerEvents: "none",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          <div>Year: {1950 + tooltip.year}</div>
          <div>Temp: {tooltip.temp.toFixed(1)}°C</div>
          <div>Moore: {Math.round(tooltip.moore).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

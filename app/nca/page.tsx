"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./nca.module.scss";
import styles1 from "@/app/components/home.module.scss";
import { SideBar } from "@/app/components-next/sidebar-next";

// Neural Cellular Automata Component
function NCASimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [gridSize] = useState(64);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<number[][]>();

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !gridRef.current) return;

    const cellSize = canvas.width / gridSize;

    gridRef.current.forEach((row, i) => {
      row.forEach((cell, j) => {
        // Create gradient based on cell value
        const intensity = cell * 255;
        ctx.fillStyle = `rgb(${Math.floor(118 * cell)}, ${Math.floor(185 * cell)}, ${Math.floor(intensity * 0.5)})`;
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      });
    });
  }, [gridSize]);

  // Initialize grid
  useEffect(() => {
    const grid = Array(gridSize).fill(0).map(() => 
      Array(gridSize).fill(0).map(() => Math.random() > 0.7 ? 1 : 0)
    );
    gridRef.current = grid;
    drawGrid();
  }, [gridSize, drawGrid]);

  const updateGrid = useCallback(() => {
    if (!gridRef.current) return;

    const newGrid = gridRef.current.map((row, i) =>
      row.map((cell, j) => {
        // Count neighbors
        let neighbors = 0;
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const ni = (i + di + gridSize) % gridSize;
            const nj = (j + dj + gridSize) % gridSize;
            neighbors += gridRef.current![ni][nj];
          }
        }

        // Neural CA rules - more complex than Conway's Game of Life
        // Using a continuous state space [0, 1]
        let newValue = cell;
        
        // Apply simple growth/decay rules
        if (neighbors >= 2 && neighbors <= 4) {
          newValue = Math.min(1, cell + 0.1);
        } else if (neighbors > 4) {
          newValue = Math.max(0, cell - 0.15);
        } else {
          newValue = Math.max(0, cell - 0.05);
        }

        // Add some noise for organic behavior
        newValue += (Math.random() - 0.5) * 0.02;
        return Math.max(0, Math.min(1, newValue));
      })
    );

    gridRef.current = newGrid;
    drawGrid();
  }, [gridSize, drawGrid]);

  const animate = useCallback(() => {
    updateGrid();
    animationRef.current = setTimeout(() => {
      if (isRunning) {
        requestAnimationFrame(animate);
      }
    }, 100 / speed);
  }, [updateGrid, isRunning, speed]);

  useEffect(() => {
    if (isRunning) {
      animate();
    } else if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isRunning, speed, animate]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !gridRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellSize = canvas.width / gridSize;
    const i = Math.floor(y / cellSize);
    const j = Math.floor(x / cellSize);

    if (i >= 0 && i < gridSize && j >= 0 && j < gridSize) {
      gridRef.current[i][j] = 1;
      drawGrid();
    }
  };

  const reset = () => {
    const grid = Array(gridSize).fill(0).map(() => 
      Array(gridSize).fill(0).map(() => Math.random() > 0.7 ? 1 : 0)
    );
    gridRef.current = grid;
    drawGrid();
  };

  const clear = () => {
    const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    gridRef.current = grid;
    drawGrid();
  };

  return (
    <div className={styles.ncaContainer}>
      <h1>Neural Cellular Automata</h1>
      <p className={styles.description}>
        An interactive simulation of Neural Cellular Automata - a blend of classical cellular automata
        and neural network-inspired growth patterns. Click on the canvas to add energy to cells.
      </p>
      
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          className={styles.ncaCanvas}
          onClick={handleCanvasClick}
        />
      </div>

      <div className={styles.controls}>
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className={styles.button}
        >
          {isRunning ? "⏸ Pause" : "▶ Play"}
        </button>
        
        <button onClick={reset} className={styles.button}>
          🔄 Reset
        </button>
        
        <button onClick={clear} className={styles.button}>
          🗑 Clear
        </button>

        <div className={styles.sliderContainer}>
          <label>Speed: {speed}x</label>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className={styles.slider}
          />
        </div>
      </div>

      <div className={styles.info}>
        <h2>About Neural Cellular Automata</h2>
        <p>
          Neural Cellular Automata (NCA) combine the local interaction patterns of classical 
          cellular automata with continuous state spaces and learning-inspired update rules.
        </p>
        <ul>
          <li>Each cell has a continuous state between 0 (dead) and 1 (fully alive)</li>
          <li>Cells interact with their 8 neighbors using growth and decay rules</li>
          <li>Random noise creates organic, evolving patterns</li>
          <li>Click anywhere to inject energy and watch patterns emerge</li>
        </ul>
        <p className={styles.inspiration}>
          Inspired by research in differentiable cellular automata and self-organizing systems.
          Learn more at <a href="https://distill.pub/2020/growing-ca/" target="_blank" rel="noopener noreferrer">
            Distill.pub&lsquo;s Growing Neural Cellular Automata
          </a>
        </p>
      </div>
    </div>
  );
}

export default function NCAPage() {
  return (
    <div className={`${styles1.container}`}>
      <SideBar className={styles1["sidebar-show"]} />
      <div className={styles.pageContent}>
        <NCASimulation />
      </div>
    </div>
  );
}

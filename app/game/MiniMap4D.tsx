'use client';

import React, { useRef, useEffect } from 'react';
import { Vec4 } from './HyperMath';

interface Entity4DMarker {
  pos4: Vec4;
  color: string;
  size?: number;
  label?: string;
}

interface MiniMap4DProps {
  playerPos: Vec4;
  playerAngle: number;  // Rotation in XZ plane
  entities: Entity4DMarker[];
  worldSize: number;
  wRange: [number, number];  // Min/max W to display
  size?: number;
  showWAxis?: boolean;
}

/**
 * 4D Minimap that shows X, Z as horizontal plane and W as vertical axis
 * This gives a "side view" of the 4D space
 */
export function MiniMap4D({
  playerPos,
  playerAngle,
  entities,
  worldSize,
  wRange,
  size = 200,
  showWAxis = true,
}: MiniMap4DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 20, 0.9)';
    ctx.fillRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const scaleXZ = size / (worldSize * 2.5);
    const scaleW = size / ((wRange[1] - wRange[0]) * 3);

    // Grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = -worldSize; i <= worldSize; i += worldSize / 5) {
      // Vertical lines (X)
      const x = centerX + i * scaleXZ;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let i = wRange[0]; i <= wRange[1]; i += (wRange[1] - wRange[0]) / 5) {
      // Horizontal lines (W as Y)
      const y = centerY - i * scaleW;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // W axis indicator
    if (showWAxis) {
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, size);
      ctx.lineTo(centerX, 0);
      ctx.stroke();

      // W axis label
      ctx.fillStyle = '#ff00ff';
      ctx.font = '10px monospace';
      ctx.fillText('W+', centerX + 3, 12);
      ctx.fillText('W-', centerX + 3, size - 5);
    }

    // X axis indicator
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(size, centerY);
    ctx.stroke();
    ctx.fillStyle = '#ff6666';
    ctx.font = '10px monospace';
    ctx.fillText('X+', size - 15, centerY - 3);

    // Draw entities
    entities.forEach(entity => {
      const x = centerX + entity.pos4.x * scaleXZ;
      const y = centerY - entity.pos4.w * scaleW;  // W maps to vertical
      const entitySize = entity.size || 3;

      // Draw entity marker
      ctx.fillStyle = entity.color;
      ctx.beginPath();
      ctx.arc(x, y, entitySize, 0, Math.PI * 2);
      ctx.fill();

      // Draw Z indicator (small line showing depth)
      const zLength = entity.pos4.z * scaleXZ * 0.3;
      ctx.strokeStyle = entity.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - zLength);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Label
      if (entity.label) {
        ctx.fillStyle = entity.color;
        ctx.font = '8px monospace';
        ctx.fillText(entity.label, x + entitySize + 2, y + 3);
      }
    });

    // Draw player
    const playerX = centerX + playerPos.x * scaleXZ;
    const playerY = centerY - playerPos.w * scaleW;

    // Player triangle (pointing in direction)
    ctx.save();
    ctx.translate(playerX, playerY);
    ctx.rotate(-playerAngle);  // Rotate to face direction

    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-5, 5);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // Player W indicator line
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, playerY);
    ctx.lineTo(size, playerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current W label
    ctx.fillStyle = '#ffff00';
    ctx.font = '10px monospace';
    ctx.fillText(`W: ${playerPos.w.toFixed(1)}`, 5, playerY - 3);

  }, [playerPos, playerAngle, entities, worldSize, wRange, size, showWAxis]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        border: '2px solid #00ffff',
      }}
    />
  );
}

/**
 * Alternative: Top-down minimap with W shown as color
 */
export function MiniMapTopDown4D({
  playerPos,
  playerAngle,
  entities,
  worldSize,
  size = 200,
}: Omit<MiniMap4DProps, 'wRange' | 'showWAxis'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 20, 0.9)';
    ctx.fillRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / (worldSize * 2.5);

    // Grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = -worldSize; i <= worldSize; i += worldSize / 5) {
      const x = centerX + i * scale;
      const y = centerY + i * scale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Draw entities with W as alpha/size
    entities.forEach(entity => {
      const x = centerX + entity.pos4.x * scale;
      const y = centerY - entity.pos4.z * scale;  // Z maps to vertical (top-down)
      
      // Size and alpha based on W distance from player
      const wDist = Math.abs(entity.pos4.w - playerPos.w);
      const alpha = Math.max(0.2, 1 - wDist / 15);
      const entitySize = (entity.size || 4) * (1 - wDist / 30);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = entity.color;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, entitySize), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw player
    const playerX = centerX + playerPos.x * scale;
    const playerY = centerY - playerPos.z * scale;

    ctx.save();
    ctx.translate(playerX, playerY);
    ctx.rotate(-playerAngle);

    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-5, 5);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // W indicator in corner
    ctx.fillStyle = '#00ffff';
    ctx.font = '12px monospace';
    ctx.fillText(`W: ${playerPos.w.toFixed(1)}`, 5, size - 5);

  }, [playerPos, playerAngle, entities, worldSize, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        border: '2px solid #00ffff',
      }}
    />
  );
}

/**
 * W-Layer indicator bar
 */
export function WLayerBar({
  currentW,
  minW = -20,
  maxW = 20,
  slices,
}: {
  currentW: number;
  minW?: number;
  maxW?: number;
  slices?: { w: number; name: string; color: string }[];
}) {
  const normalizedW = (currentW - minW) / (maxW - minW);

  return (
    <div style={{
      width: '100%',
      maxWidth: 300,
      background: 'rgba(0,0,20,0.9)',
      borderRadius: '8px',
      padding: '10px',
      border: '1px solid #00ffff',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '5px',
        fontFamily: 'monospace',
        fontSize: '10px',
      }}>
        <span style={{ color: '#ff0066' }}>W-</span>
        <span style={{ color: '#00ffff' }}>W: {currentW.toFixed(1)}</span>
        <span style={{ color: '#0066ff' }}>W+</span>
      </div>
      
      <div style={{
        height: 20,
        background: 'linear-gradient(to right, #ff0066, #00ff66, #0066ff)',
        borderRadius: '4px',
        position: 'relative',
      }}>
        {/* Slice markers */}
        {slices?.map(slice => {
          const pos = ((slice.w - minW) / (maxW - minW)) * 100;
          return (
            <div
              key={slice.w}
              style={{
                position: 'absolute',
                left: `${pos}%`,
                top: -3,
                width: 2,
                height: 26,
                background: slice.color,
                transform: 'translateX(-50%)',
              }}
              title={`${slice.name} (W=${slice.w})`}
            />
          );
        })}
        
        {/* Current position indicator */}
        <div style={{
          position: 'absolute',
          left: `${normalizedW * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 12,
          height: 12,
          background: '#fff',
          borderRadius: '50%',
          border: '2px solid #000',
          boxShadow: '0 0 10px white',
        }} />
      </div>
    </div>
  );
}

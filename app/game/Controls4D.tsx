'use client';

import React, { useEffect, useCallback, useRef } from 'react';

export type Movement4D = {
  dx: number;  // Left/Right (A/D)
  dy: number;  // Up/Down (Space/Shift)
  dz: number;  // Forward/Back (W/S)
  dw: number;  // W dimension (Q/E)
};

export type OnMove4D = (movement: Movement4D) => void;

interface Controls4DOptions {
  onMove: OnMove4D;
  sensitivity?: number;
  wStepMode?: 'continuous' | 'discrete';  // discrete = jump slices, continuous = smooth
  wStepSize?: number;  // For discrete mode
}

/**
 * Hook for 4D keyboard controls
 * 
 * Default mapping:
 * - W/S: Forward/Backward (Z axis)
 * - A/D: Left/Right (X axis)
 * - Space/Shift: Up/Down (Y axis)
 * - Q/E: W dimension navigation
 */
export function useControls4D(options: Controls4DOptions) {
  const { onMove, sensitivity = 1, wStepMode = 'continuous', wStepSize = 1 } = options;
  const keysRef = useRef<Record<string, boolean>>({});
  const lastWPressRef = useRef<number>(0);

  const updateMovement = useCallback(() => {
    const keys = keysRef.current;
    
    const dx = ((keys['d'] || keys['arrowright']) ? 1 : 0) - ((keys['a'] || keys['arrowleft']) ? 1 : 0);
    const dz = ((keys['w'] || keys['arrowup']) ? 1 : 0) - ((keys['s'] || keys['arrowdown']) ? 1 : 0);
    const dy = (keys[' '] ? 1 : 0) - (keys['shift'] ? 1 : 0);
    
    let dw = 0;
    if (wStepMode === 'continuous') {
      dw = (keys['e'] ? 1 : 0) - (keys['q'] ? 1 : 0);
    }
    // Discrete mode is handled in keydown

    onMove({
      dx: dx * sensitivity,
      dy: dy * sensitivity,
      dz: dz * sensitivity,
      dw: dw * sensitivity,
    });
  }, [onMove, sensitivity, wStepMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Prevent default for game keys
      if (['w', 'a', 's', 'd', 'q', 'e', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }

      keysRef.current[key] = true;

      // Discrete W stepping (jump between slices)
      if (wStepMode === 'discrete') {
        const now = Date.now();
        if (now - lastWPressRef.current > 200) { // Debounce
          if (key === 'e') {
            onMove({ dx: 0, dy: 0, dz: 0, dw: wStepSize });
            lastWPressRef.current = now;
          } else if (key === 'q') {
            onMove({ dx: 0, dy: 0, dz: 0, dw: -wStepSize });
            lastWPressRef.current = now;
          }
        }
      }

      updateMovement();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      updateMovement();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove, updateMovement, wStepMode, wStepSize]);
}

/**
 * On-screen controls for mobile/touch devices
 */
export function Controls4DOverlay({
  onWChange,
  currentW,
  minW = -20,
  maxW = 20,
}: {
  onWChange: (newW: number) => void;
  currentW: number;
  minW?: number;
  maxW?: number;
}) {
  const handleSliceUp = () => {
    if (currentW < maxW) onWChange(currentW + 1);
  };

  const handleSliceDown = () => {
    if (currentW > minW) onWChange(currentW - 1);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 100,
    }}>
      {/* W+ button */}
      <button
        onClick={handleSliceUp}
        disabled={currentW >= maxW}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: currentW >= maxW ? '#333' : 'linear-gradient(135deg, #0066ff, #00aaff)',
          border: '2px solid #00ffff',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: currentW >= maxW ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
        }}
      >
        W+
      </button>

      {/* Current W display */}
      <div style={{
        textAlign: 'center',
        color: '#00ffff',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(0,0,20,0.8)',
        padding: '8px',
        borderRadius: '4px',
      }}>
        W: {currentW.toFixed(1)}
      </div>

      {/* W- button */}
      <button
        onClick={handleSliceDown}
        disabled={currentW <= minW}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: currentW <= minW ? '#333' : 'linear-gradient(135deg, #ff0066, #ff00aa)',
          border: '2px solid #ff00ff',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: currentW <= minW ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)',
        }}
      >
        W-
      </button>
    </div>
  );
}

/**
 * Slice selector HUD - shows available slices and allows quick navigation
 */
export function SliceSelector({
  slices,
  currentSlice,
  onSliceSelect,
}: {
  slices: { w: number; name: string; color: string }[];
  currentSlice: number;
  onSliceSelect: (w: number) => void;
}) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      right: 10,
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      background: 'rgba(0,0,20,0.9)',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #00ffff',
    }}>
      <div style={{ 
        color: '#00ffff', 
        fontSize: '10px', 
        fontFamily: 'monospace',
        textAlign: 'center',
        marginBottom: '4px'
      }}>
        W SLICES
      </div>
      {slices.map((slice) => (
        <button
          key={slice.w}
          onClick={() => onSliceSelect(slice.w)}
          style={{
            padding: '6px 10px',
            background: currentSlice === slice.w 
              ? slice.color 
              : 'rgba(0,0,0,0.5)',
            border: `1px solid ${slice.color}`,
            borderRadius: '4px',
            color: 'white',
            fontSize: '11px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            opacity: currentSlice === slice.w ? 1 : 0.6,
            transition: 'all 0.2s',
          }}
        >
          {slice.name} (W={slice.w})
        </button>
      ))}
    </div>
  );
}

/**
 * Touch joystick for mobile that includes W axis (2-finger vertical for W)
 */
export function TouchJoystick4D({
  onMove,
  size = 120,
}: {
  onMove: OnMove4D;
  size?: number;
}) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeTouchRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchRef.current !== null) return;
    const touch = e.touches[0];
    activeTouchRef.current = touch.identifier;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTouchRef.current === null) return;
    
    const touch = Array.from(e.touches).find(t => t.identifier === activeTouchRef.current);
    if (!touch || !joystickRef.current || !knobRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = (touch.clientX - centerX) / (size / 2);
    let dy = -(touch.clientY - centerY) / (size / 2); // Invert Y

    // Clamp to unit circle
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }

    // Update knob position
    knobRef.current.style.transform = `translate(${dx * size / 3}px, ${-dy * size / 3}px)`;

    // Map to movement (XZ plane)
    onMove({
      dx: dx,
      dy: 0,
      dz: dy,
      dw: 0,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchRef.current);
    if (touch) {
      activeTouchRef.current = null;
      if (knobRef.current) {
        knobRef.current.style.transform = 'translate(0, 0)';
      }
      onMove({ dx: 0, dy: 0, dz: 0, dw: 0 });
    }
  };

  return (
    <div
      ref={joystickRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'absolute',
        bottom: 30,
        left: 30,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(0, 255, 255, 0.1)',
        border: '2px solid rgba(0, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: size / 3,
          height: size / 3,
          borderRadius: '50%',
          background: 'rgba(0, 255, 255, 0.5)',
          border: '2px solid #00ffff',
          transition: 'transform 0.05s',
        }}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/*
  SEMANTIC SWIPE INTERFACE
  ========================
  The vision: Navigate meaning spatially, like Gboard's swipe but for concepts.
  
  Core insight: Our brains are spatial processors. We evolved to navigate 3D terrain,
  recognize patterns, remember locations. Symbolic text is a compression - unnatural.
  
  This interface maps concepts to 2D space. You swipe through meaning-space.
  Nearby = semantically related. Distance = conceptual distance.
  Your trajectory through the space becomes the "query" - like drawing a word on Gboard.
  
  The W dimension (4D) could represent: time, abstraction level, certainty, or "depth" into topic.
*/

interface Concept {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number; // depth/abstraction level
  size: number; // importance
  color: string;
  connections: string[]; // related concept IDs
  category: string;
}

interface SwipePoint {
  x: number;
  y: number;
  t: number; // timestamp
  velocity: number;
}

// Sample semantic space - in reality, this would be embedded from your data
const CONCEPTS: Concept[] = [
  // Core tech concepts cluster
  {
    id: "ai",
    label: "AI",
    x: 400,
    y: 200,
    w: 0,
    size: 40,
    color: "#00ff88",
    connections: ["ml", "neural", "llm"],
    category: "tech",
  },
  {
    id: "ml",
    label: "ML",
    x: 340,
    y: 250,
    w: 1,
    size: 30,
    color: "#00cc66",
    connections: ["ai", "data", "neural"],
    category: "tech",
  },
  {
    id: "neural",
    label: "Neural",
    x: 460,
    y: 250,
    w: 1,
    size: 28,
    color: "#00aa55",
    connections: ["ai", "brain", "ml"],
    category: "tech",
  },
  {
    id: "llm",
    label: "LLM",
    x: 430,
    y: 150,
    w: 1,
    size: 32,
    color: "#22ffaa",
    connections: ["ai", "language", "gpt"],
    category: "tech",
  },
  {
    id: "gpt",
    label: "GPT",
    x: 500,
    y: 130,
    w: 2,
    size: 25,
    color: "#44ffcc",
    connections: ["llm", "openai"],
    category: "tech",
  },

  // Physics cluster
  {
    id: "physics",
    label: "Physics",
    x: 150,
    y: 350,
    w: 0,
    size: 38,
    color: "#ff6600",
    connections: ["thermo", "quantum", "energy"],
    category: "science",
  },
  {
    id: "thermo",
    label: "Thermo",
    x: 100,
    y: 420,
    w: 1,
    size: 26,
    color: "#ff8833",
    connections: ["physics", "entropy", "energy"],
    category: "science",
  },
  {
    id: "entropy",
    label: "Entropy",
    x: 60,
    y: 480,
    w: 2,
    size: 24,
    color: "#ffaa55",
    connections: ["thermo", "info"],
    category: "science",
  },
  {
    id: "quantum",
    label: "Quantum",
    x: 200,
    y: 420,
    w: 1,
    size: 28,
    color: "#ff5500",
    connections: ["physics", "wave"],
    category: "science",
  },
  {
    id: "energy",
    label: "Energy",
    x: 150,
    y: 280,
    w: 1,
    size: 30,
    color: "#ff7744",
    connections: ["physics", "thermo", "money"],
    category: "science",
  },

  // Communication cluster
  {
    id: "comm",
    label: "Communication",
    x: 600,
    y: 400,
    w: 0,
    size: 36,
    color: "#00aaff",
    connections: ["language", "bandwidth", "signal"],
    category: "social",
  },
  {
    id: "language",
    label: "Language",
    x: 550,
    y: 330,
    w: 1,
    size: 30,
    color: "#0088dd",
    connections: ["comm", "llm", "meaning"],
    category: "social",
  },
  {
    id: "bandwidth",
    label: "Bandwidth",
    x: 680,
    y: 350,
    w: 1,
    size: 26,
    color: "#0066bb",
    connections: ["comm", "signal", "info"],
    category: "social",
  },
  {
    id: "signal",
    label: "Signal",
    x: 720,
    y: 420,
    w: 2,
    size: 22,
    color: "#0044aa",
    connections: ["bandwidth", "noise"],
    category: "social",
  },
  {
    id: "meaning",
    label: "Meaning",
    x: 500,
    y: 380,
    w: 1,
    size: 32,
    color: "#22ccff",
    connections: ["language", "semantic"],
    category: "social",
  },

  // Abstract/meta cluster
  {
    id: "info",
    label: "Information",
    x: 300,
    y: 450,
    w: 0,
    size: 34,
    color: "#aa00ff",
    connections: ["entropy", "bandwidth", "data"],
    category: "meta",
  },
  {
    id: "data",
    label: "Data",
    x: 350,
    y: 380,
    w: 1,
    size: 28,
    color: "#8800dd",
    connections: ["info", "ml"],
    category: "meta",
  },
  {
    id: "semantic",
    label: "Semantic",
    x: 420,
    y: 450,
    w: 1,
    size: 26,
    color: "#bb22ff",
    connections: ["meaning", "ai"],
    category: "meta",
  },

  // Money/value cluster
  {
    id: "money",
    label: "Money",
    x: 750,
    y: 200,
    w: 0,
    size: 35,
    color: "#ffdd00",
    connections: ["value", "energy", "trade"],
    category: "value",
  },
  {
    id: "value",
    label: "Value",
    x: 700,
    y: 250,
    w: 1,
    size: 28,
    color: "#ddbb00",
    connections: ["money", "meaning"],
    category: "value",
  },
  {
    id: "trade",
    label: "Trade",
    x: 800,
    y: 260,
    w: 1,
    size: 24,
    color: "#ccaa00",
    connections: ["money", "comm"],
    category: "value",
  },

  // Human/brain cluster
  {
    id: "brain",
    label: "Brain",
    x: 250,
    y: 150,
    w: 0,
    size: 36,
    color: "#ff00aa",
    connections: ["neural", "spatial", "cognition"],
    category: "human",
  },
  {
    id: "spatial",
    label: "Spatial",
    x: 200,
    y: 200,
    w: 1,
    size: 28,
    color: "#dd0088",
    connections: ["brain", "navigation"],
    category: "human",
  },
  {
    id: "cognition",
    label: "Cognition",
    x: 300,
    y: 200,
    w: 1,
    size: 26,
    color: "#bb0066",
    connections: ["brain", "ai"],
    category: "human",
  },
  {
    id: "navigation",
    label: "Navigation",
    x: 150,
    y: 150,
    w: 2,
    size: 24,
    color: "#aa0055",
    connections: ["spatial", "map"],
    category: "human",
  },
];

export default function SemanticSwipePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [swipePath, setSwipePath] = useState<SwipePoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activatedConcepts, setActivatedConcepts] = useState<Set<string>>(
    new Set(),
  );
  const [wLevel, setWLevel] = useState(0); // Current "depth" level (0-3)
  const [resultText, setResultText] = useState("");
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const lastPointRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const animationRef = useRef<number>(0);

  // Calculate which concepts are "hit" by the swipe path
  const calculateActivations = useCallback(
    (path: SwipePoint[]) => {
      const activated = new Set<string>();

      path.forEach((point) => {
        CONCEPTS.forEach((concept) => {
          // Only activate concepts at current W level (or within 1 level)
          if (Math.abs(concept.w - wLevel) > 1) return;

          const dx = point.x - concept.x;
          const dy = point.y - concept.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Activation radius based on concept size and velocity
          const activationRadius = concept.size + point.velocity * 0.3;

          if (dist < activationRadius) {
            activated.add(concept.id);
          }
        });
      });

      return activated;
    },
    [wLevel],
  );

  // Generate result text from activated concepts
  const generateResult = useCallback((activated: Set<string>) => {
    if (activated.size === 0) return "";

    const conceptLabels = Array.from(activated)
      .map((id) => CONCEPTS.find((c) => c.id === id)?.label)
      .filter(Boolean);

    // Find the "trajectory" through concepts
    const trajectory = conceptLabels.join(" → ");

    // Simple semantic combination (in reality, this would query an LLM or embedding space)
    const combinations: Record<string, string> = {
      "AI → ML → Neural": "Training neural networks with machine learning",
      "Physics → Entropy → Information":
        "Information theory and thermodynamics connection",
      "Communication → Bandwidth → Signal":
        "Channel capacity and signal transmission",
      "Brain → Spatial → Navigation": "Cognitive mapping and spatial memory",
      "AI → Language → Meaning": "Natural language understanding in AI systems",
      "Money → Value → Trade": "Economic exchange and value creation",
      "Energy → Thermo → Entropy": "Thermodynamic arrow of time",
      "AI → LLM → GPT": "Large language models and transformers",
    };

    // Check for matching trajectories
    for (const [key, value] of Object.entries(combinations)) {
      if (
        trajectory.includes(key.split(" → ")[0]) &&
        trajectory.includes(key.split(" → ").pop()!)
      ) {
        return `${trajectory}\n\n→ ${value}`;
      }
    }

    return trajectory;
  }, []);

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, width, height);

    // Apply camera transform
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2 + cameraOffset.x, -height / 2 + cameraOffset.y);

    // Draw connections first (below everything)
    ctx.globalAlpha = 0.15;
    CONCEPTS.forEach((concept) => {
      concept.connections.forEach((targetId) => {
        const target = CONCEPTS.find((c) => c.id === targetId);
        if (!target) return;

        // Fade connections based on W distance
        const conceptWDist = Math.abs(concept.w - wLevel);
        const targetWDist = Math.abs(target.w - wLevel);
        if (conceptWDist > 1.5 || targetWDist > 1.5) return;

        ctx.beginPath();
        ctx.strokeStyle = concept.color;
        ctx.lineWidth = 1;
        ctx.moveTo(concept.x, concept.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      });
    });
    ctx.globalAlpha = 1;

    // Draw concepts
    CONCEPTS.forEach((concept) => {
      const wDist = Math.abs(concept.w - wLevel);

      // Skip concepts too far in W
      if (wDist > 1.5) return;

      // Scale and opacity based on W distance (closer = bigger & more opaque)
      const wScale = 1 - wDist * 0.3;
      const wAlpha = 1 - wDist * 0.5;

      const isActivated = activatedConcepts.has(concept.id);
      const size = concept.size * wScale * (isActivated ? 1.3 : 1);

      ctx.globalAlpha = wAlpha;

      // Glow for activated concepts
      if (isActivated) {
        ctx.beginPath();
        ctx.arc(concept.x, concept.y, size + 10, 0, Math.PI * 2);
        ctx.fillStyle = concept.color + "44";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(concept.x, concept.y, size + 20, 0, Math.PI * 2);
        ctx.fillStyle = concept.color + "22";
        ctx.fill();
      }

      // Main circle
      ctx.beginPath();
      ctx.arc(concept.x, concept.y, size, 0, Math.PI * 2);
      ctx.fillStyle = isActivated ? "#ffffff" : concept.color;
      ctx.fill();

      // Label
      ctx.fillStyle = isActivated ? concept.color : "#ffffff";
      ctx.font = `${isActivated ? "bold " : ""}${12 + size * 0.2}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(concept.label, concept.x, concept.y);
    });

    ctx.globalAlpha = 1;

    // Draw swipe path
    if (swipePath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(swipePath[0].x, swipePath[0].y);
      for (let i = 1; i < swipePath.length; i++) {
        ctx.lineTo(swipePath[i].x, swipePath[i].y);
      }
      ctx.stroke();

      // Velocity trail glow
      ctx.beginPath();
      ctx.strokeStyle = "#ffffff44";
      ctx.lineWidth = 8;
      ctx.moveTo(swipePath[0].x, swipePath[0].y);
      for (let i = 1; i < swipePath.length; i++) {
        ctx.lineTo(swipePath[i].x, swipePath[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();

    // Draw W-level indicator (not affected by camera)
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Depth (W): ${wLevel}`, 20, height - 60);

    // W slider visualization
    ctx.fillStyle = "#333";
    ctx.fillRect(20, height - 50, 150, 10);
    ctx.fillStyle = "#00ffaa";
    ctx.fillRect(20 + (wLevel / 3) * 150, height - 55, 10, 20);

    animationRef.current = requestAnimationFrame(render);
  }, [swipePath, activatedConcepts, wLevel, cameraOffset, zoom]);

  // Start render loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Mouse/touch handlers
  const getPoint = (
    e: React.MouseEvent | React.TouchEvent,
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Reverse camera transform
    const x =
      (clientX - rect.left - canvas.width / 2) / zoom +
      canvas.width / 2 -
      cameraOffset.x;
    const y =
      (clientY - rect.top - canvas.height / 2) / zoom +
      canvas.height / 2 -
      cameraOffset.y;

    return { x, y };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);

    const point = getPoint(e);
    const now = Date.now();

    setSwipePath([{ ...point, t: now, velocity: 0 }]);
    setActivatedConcepts(new Set());
    setResultText("");
    lastPointRef.current = { ...point, t: now };
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const point = getPoint(e);
    const now = Date.now();

    // Calculate velocity
    let vel = 0;
    if (lastPointRef.current) {
      const dx = point.x - lastPointRef.current.x;
      const dy = point.y - lastPointRef.current.y;
      const dt = now - lastPointRef.current.t;
      if (dt > 0) {
        vel = (Math.sqrt(dx * dx + dy * dy) / dt) * 10;
      }
    }

    setSwipePath((prev) => [...prev, { ...point, t: now, velocity: vel }]);
    lastPointRef.current = { ...point, t: now };

    // Update activations in real-time
    setActivatedConcepts((prev) => {
      const newActivated = calculateActivations([
        ...swipePath,
        { ...point, t: now, velocity: vel },
      ]);
      return newActivated;
    });
  };

  const handleEnd = () => {
    setIsDrawing(false);

    // Generate result from final path
    const result = generateResult(activatedConcepts);
    setResultText(result);

    // Fade out path after delay
    setTimeout(() => {
      setSwipePath([]);
    }, 2000);
  };

  // Keyboard controls for W level and camera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          setWLevel((prev) => Math.min(3, prev + 1));
          break;
        case "ArrowDown":
        case "s":
          setWLevel((prev) => Math.max(0, prev - 1));
          break;
        case "+":
        case "=":
          setZoom((prev) => Math.min(3, prev + 0.2));
          break;
        case "-":
          setZoom((prev) => Math.max(0.3, prev - 0.2));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0a0a0f",
        fontFamily: "monospace",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onWheel={handleWheel}
        style={{
          cursor: isDrawing ? "crosshair" : "grab",
          touchAction: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            color: "#00ffaa",
            margin: 0,
            fontSize: "24px",
            textShadow: "0 0 20px #00ffaa44",
          }}
        >
          Semantic Swipe
        </h1>
        <p
          style={{
            color: "#888",
            margin: "8px 0 0 0",
            fontSize: "14px",
          }}
        >
          Draw through concepts. Navigate meaning spatially.
        </p>
      </div>

      {/* Result display */}
      {resultText && (
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a1a2e",
            border: "1px solid #00ffaa",
            borderRadius: "8px",
            padding: "16px 24px",
            maxWidth: "500px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#00ffaa",
              fontSize: "16px",
              whiteSpace: "pre-line",
            }}
          >
            {resultText}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          color: "#666",
          fontSize: "12px",
          textAlign: "right",
        }}
      >
        <div>Swipe/draw to connect concepts</div>
        <div>W/S or ↑/↓: Change depth level</div>
        <div>Scroll: Zoom</div>
        <div style={{ marginTop: 8, color: "#00ffaa" }}>
          Bandwidth = area × velocity
        </div>
      </div>

      {/* Activated concepts list */}
      {activatedConcepts.size > 0 && (
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 20,
            background: "#1a1a2e88",
            borderRadius: "8px",
            padding: "12px",
            minWidth: "150px",
          }}
        >
          <div style={{ color: "#888", fontSize: "11px", marginBottom: 8 }}>
            ACTIVATED:
          </div>
          {Array.from(activatedConcepts).map((id) => {
            const concept = CONCEPTS.find((c) => c.id === id);
            return concept ? (
              <div
                key={id}
                style={{
                  color: concept.color,
                  fontSize: "14px",
                  marginBottom: 4,
                }}
              >
                {concept.label}
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

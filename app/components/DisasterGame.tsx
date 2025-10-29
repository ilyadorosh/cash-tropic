"use client";

import { useEffect, useRef, useState } from "react";

interface ContextPiece {
  id: string;
  text: string;
  summary: string;
  x: number;
  y: number;
  emoji: string;
  character: string;
}

interface Character {
  name: string;
  emoji: string;
  color: string;
  systemPrompt: string;
}

export default function DisasterGame() {
  const gameRef = useRef<any>(null);
  const Phaser = useRef<any>(null);
  const [gameReady, setGameReady] = useState(false);
  const dragStateRef = useRef({ x: 400, y: 300 });
  const [selectedItem, setSelectedItem] = useState<ContextPiece | null>(null);
  const [contextPieces, setContextPieces] = useState<ContextPiece[]>([]);
  const [characterInteraction, setCharacterInteraction] = useState<{
    character: string;
    response: string;
  } | null>(null);

  // Fetch data from your DB
  useEffect(() => {
    const loadContextPieces = async () => {
      try {
        // Try localStorage first
        const saved = localStorage.getItem("contextPieces");
        if (saved) {
          setContextPieces(JSON.parse(saved));
          return;
        }

        // Fetch from your API - example from your existing profiles
        const res = await fetch("/api/users");
        const users = await res.json();

        // Transform DB data into context pieces
        const pieces: ContextPiece[] = users
          .slice(0, 5)
          .map((user: any, idx: number) => ({
            id: user.id.toString(),
            text: user.context || user.bio || "User context here",
            summary: user.username || `User ${user.id}`,
            x: 150 + (idx % 2) * 500,
            y: 150 + Math.floor(idx / 2) * 200,
            emoji: user.emoji || "👤",
            character: "jensen",
          }));

        setContextPieces(pieces);
        localStorage.setItem("contextPieces", JSON.stringify(pieces));
      } catch (error) {
        console.error("Error loading context pieces:", error);
      }
    };

    loadContextPieces();
  }, []);

  // Save to localStorage whenever pieces change
  useEffect(() => {
    localStorage.setItem("contextPieces", JSON.stringify(contextPieces));
  }, [contextPieces]);
  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("contextPieces");
    if (saved) {
      setContextPieces(JSON.parse(saved));
    } else {
      // Demo data
      const demo: ContextPiece[] = [
        {
          id: "1",
          text: "Silicon Valley was founded on the principle of democratizing technology and making computers accessible to everyone.",
          summary: "SV founding ethos",
          x: 150,
          y: 150,
          emoji: "💻",
          character: "jensen",
        },
        {
          id: "2",
          text: "The most powerful force in the universe is compound interest - both in finance and in knowledge.",
          summary: "Compound power",
          x: 650,
          y: 150,
          emoji: "📈",
          character: "trump",
        },
        {
          id: "3",
          text: "Love thy neighbor as thyself - the foundation of all moral philosophy.",
          summary: "Universal compassion",
          x: 400,
          y: 300,
          emoji: "❤️",
          character: "jesus",
        },
        {
          id: "4",
          text: "AI will be the most transformative technology of our time, reshaping every industry.",
          summary: "AI transformation",
          x: 150,
          y: 450,
          emoji: "🤖",
          character: "jensen",
        },
        {
          id: "5",
          text: "Business is about creating value and building something great that lasts.",
          summary: "Value creation",
          x: 650,
          y: 450,
          emoji: "🏢",
          character: "trump",
        },
      ];
      setContextPieces(demo);
      localStorage.setItem("contextPieces", JSON.stringify(demo));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("contextPieces", JSON.stringify(contextPieces));
  }, [contextPieces]);

  const characters: Record<string, Character> = {
    trump: {
      name: "Donald Trump",
      emoji: "🧑‍💼",
      color: "#f5576c",
      systemPrompt:
        "You are Donald Trump. Respond in his distinctive style - bold, confident, with superlatives. Make deals.",
    },
    jensen: {
      name: "Jensen Huang",
      emoji: "💡",
      color: "#76b900",
      systemPrompt:
        "You are Jensen Huang, CEO of NVIDIA. Speak about technology, AI, and innovation with technical depth.",
    },
    jesus: {
      name: "Jesus",
      emoji: "✨",
      color: "#ffd700",
      systemPrompt:
        "You are Jesus Christ. Speak with wisdom, compassion, and parables about human nature and spirituality.",
    },
  };

  useEffect(() => {
    Promise.all([import("phaser")]).then(([phaserModule]) => {
      if (gameRef.current) return;

      Phaser.current = phaserModule.default;

      const gameConfig: any = {
        type: Phaser.current.AUTO,
        parent: "phaser-container",
        width: 800,
        height: 600,
        scale: {
          mode: Phaser.current.Scale.FIT,
          autoCenter: Phaser.current.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { y: 0 },
            debug: false,
          },
        },
        audio: {
          disableWebAudio: true,
        },
        scene: {
          preload: preload,
          create: create,
          update: update,
        },
      };

      gameRef.current = new Phaser.current.Game(gameConfig);
      setGameReady(true);

      function preload(this: any) {
        this.load.crossOrigin = "anonymous";
        this.load.spritesheet(
          "player",
          "https://cdn.glitch.com/1d985b53-750d-4dbe-856f-2f14a8171797%2Ftrump_run.png",
          { frameWidth: 100, frameHeight: 100 },
        );
      }

      function create(this: any) {
        const gameScene = this;

        // Simple solid background
        this.add.rectangle(400, 300, 800, 600, 0x0a0a0a);

        // Grid lines using line graphics (Phaser 3 compatible)
        const graphics = this.make.graphics({ x: 0, y: 0, add: true });
        graphics.lineStyle(1, 0x222222, 0.5);

        // Vertical lines
        for (let i = 0; i < 800; i += 50) {
          graphics.beginPath();
          graphics.moveTo(i, 0);
          graphics.lineTo(i, 600);
          graphics.closePath();
          graphics.strokePath();
        }

        // Horizontal lines
        for (let i = 0; i < 600; i += 50) {
          graphics.beginPath();
          graphics.moveTo(0, i);
          graphics.lineTo(800, i);
          graphics.closePath();
          graphics.strokePath();
        }

        // Player
        const player = this.physics.add.sprite(400, 300, "player");
        player.setScale(0.3);
        player.setInteractive();
        player.setDrag(0.95);
        player.setMaxVelocity(400);
        player.setCollideWorldBounds(true);
        player.setBounce(0.2);

        // Create context pieces
        const itemGroup = this.physics.add.group();
        const textGroup = this.add.group();

        contextPieces.forEach((piece) => {
          // Background circle for context piece
          const circle = this.add.circle(piece.x, piece.y, 40, 0x2a2a2a);
          circle.setStrokeStyle(2, 0x667eea);
          circle.setInteractive();
          circle.setData("pieceId", piece.id);

          // Emoji
          const emoji = this.add
            .text(piece.x, piece.y - 15, piece.emoji, {
              fontSize: "24px",
            })
            .setOrigin(0.5);

          // Summary text
          const summary = this.add
            .text(piece.x, piece.y + 20, piece.summary, {
              fontSize: "10px",
              fill: "#aaaaaa",
              align: "center",
            })
            .setOrigin(0.5);

          // Hover effects
          circle.on("pointerover", () => {
            circle.setFillStyle(0x3a3a3a);
            circle.setScale(1.1);
            summary.setFill("#ffffff");
          });

          circle.on("pointerout", () => {
            circle.setFillStyle(0x2a2a2a);
            circle.setScale(1);
            summary.setFill("#aaaaaa");
          });

          circle.on("pointerdown", () => {
            setSelectedItem(piece);
          });

          itemGroup.add(circle);
          textGroup.add(emoji);
          textGroup.add(summary);

          // Store reference for updates
          circle.emoji = emoji;
          circle.summary = summary;
        });

        // Player collision with pieces
        this.physics.add.overlap(player, itemGroup, (p: any, piece: any) => {
          const pieceId = piece.getData("pieceId");
          const pieceData = contextPieces.find((cp) => cp.id === pieceId);
          if (pieceData) {
            setSelectedItem(pieceData);
          }
        });

        // Drag input
        this.input.on("dragstart", (pointer: any, gameObject: any) => {
          if (gameObject === player) {
            dragStateRef.current.x = pointer.x;
            dragStateRef.current.y = pointer.y;
          }
        });

        this.input.on(
          "drag",
          (pointer: any, gameObject: any, dragX: number, dragY: number) => {
            dragStateRef.current.x = dragX;
            dragStateRef.current.y = dragY;
          },
        );

        // Make all circles draggable too
        itemGroup.children.entries.forEach((circle: any) => {
          circle.setInteractive({ draggable: true });

          gameScene.input.on(
            "drag",
            (pointer: any, gameObject: any, dragX: number, dragY: number) => {
              if (gameObject === circle) {
                const pieceId = circle.getData("pieceId");
                setContextPieces((prev) =>
                  prev.map((p) =>
                    p.id === pieceId ? { ...p, x: dragX, y: dragY } : p,
                  ),
                );

                // Update visuals
                circle.setPosition(dragX, dragY);
                if (circle.emoji) circle.emoji.setPosition(dragX, dragY - 15);
                if (circle.summary)
                  circle.summary.setPosition(dragX, dragY + 20);
              }
            },
          );
        });

        this.input.setDraggable(player);

        gameScene.player = player;
        gameScene.itemGroup = itemGroup;
      }

      function update(this: any) {
        const player = this.player;
        const dragState = dragStateRef.current;

        if (!player) return;

        // Fast smooth movement
        const dx = dragState.x - player.x;
        const dy = dragState.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
          player.setVelocity((dx / distance) * 350, (dy / distance) * 350);
          player.rotation = Math.atan2(dy, dx);
        } else {
          player.setVelocity(0, 0);
        }
      }
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [contextPieces]);

  const interactWithContext2 = async (characterKey: string) => {
    if (!selectedItem) return;

    const character = characters[characterKey];
    setCharacterInteraction({
      character: character.name,
      response: "💭 Thinking...",
    });

    // Mock response - replace with actual LLM call
    setTimeout(() => {
      const mockResponses: Record<string, Record<string, string>> = {
        trump: {
          "1": "📈 Tremendous innovation! We need MORE of this American greatness!",
          "2": "💰 Compound interest - that's the best deal ever made!",
          "3": "🤝 Love is good business!",
          "4": "🚀 AI will make us RICH and GREAT!",
          "5": "🏆 Building great things - that's what winners do!",
        },
        jensen: {
          "1": "⚡ The democratization of compute enables human potential.",
          "2": "📊 Exponential growth curves drive transformation.",
          "3": "🌍 Technology should serve humanity.",
          "4": "🧠 AI and accelerated computing converge at the edge.",
          "5": "🎯 Value = Performance × Efficiency × Scale.",
        },
        jesus: {
          "1": "🕊️ Share knowledge as you share bread.",
          "2": "✨ All growth is divine when serving others.",
          "3": "❤️ This is the heart of all wisdom.",
          "4": "🙏 Use great power for great compassion.",
          "5": "⛪ Legacy is measured in love, not wealth.",
        },
      };

      const response =
        mockResponses[characterKey]?.[selectedItem.id] ||
        "💬 Interesting perspective!";

      setCharacterInteraction({
        character: character.name,
        response,
      });
    }, 800);
  };

  // but update the interactWithContext to save to DB too:

  const interactWithContext = async (characterKey: string) => {
    if (!selectedItem) return;

    const character = characters[characterKey];
    setCharacterInteraction({
      character: character.name,
      response: "💭 Thinking...",
    });

    try {
      const res = await fetch("/api/characterThink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: characterKey,
          context: selectedItem.text,
          systemPrompt: character.systemPrompt,
        }),
      });

      const data = await res.json();

      setCharacterInteraction({
        character: character.name,
        response: data.response,
      });

      // Add response to canvas
      const newResponsePiece: ContextPiece = {
        id: `response_${Date.now()}`,
        text: data.response,
        summary: `${character.name}'s take`,
        x: selectedItem.x + 100 + Math.random() * 100,
        y: selectedItem.y + 100 + Math.random() * 100,
        emoji: character.emoji,
        character: characterKey,
      };

      setContextPieces((prev) => [...prev, newResponsePiece]);

      // Save to DB (optional - create new route)
      await fetch("/api/saveInteraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPieceId: selectedItem.id,
          character: characterKey,
          response: data.response,
          x: newResponsePiece.x,
          y: newResponsePiece.y,
        }),
      }).catch((err) => console.error("Error saving to DB:", err));
    } catch (error) {
      console.error("Error:", error);
      setCharacterInteraction({
        character: character.name,
        response: "❌ Error calling LLM",
      });
    }
  };

  const addContextPiece = () => {
    const newPiece: ContextPiece = {
      id: Date.now().toString(),
      text: "Enter your context here...",
      summary: "New context",
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
      emoji: "📝",
      character: "jensen",
    };
    setContextPieces([...contextPieces, newPiece]);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        height: "100vh",
        padding: "20px",
        backgroundColor: "#0a0a0a",
      }}
    >
      <div
        id="phaser-container"
        style={{
          flex: 1,
          border: "2px solid #333",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#000",
          cursor: "grab",
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          flex: 0.35,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Context Viewer */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            border: "2px solid #333",
            borderRadius: "8px",
            padding: "20px",
            color: "#fff",
            overflowY: "auto",
            flex: 1,
          }}
        >
          <h3>📚 Context</h3>
          {selectedItem ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "24px" }}>{selectedItem.emoji}</span>
                <strong>{selectedItem.summary}</strong>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: "#ddd",
                  marginBottom: "20px",
                }}
              >
                {selectedItem.text}
              </p>

              {/* Character Interactions */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {Object.entries(characters).map(([key, char]) => (
                  <button
                    key={key}
                    onClick={() => interactWithContext(key)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: char.color,
                      color: "#000",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    {char.emoji} {char.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "#666" }}>Drag to a context piece to view</p>
          )}
        </div>

        {/* Character Response */}
        {characterInteraction && (
          <div
            style={{
              backgroundColor: "#2a2a2a",
              border: "2px solid #667eea",
              borderRadius: "8px",
              padding: "20px",
              color: "#fff",
            }}
          >
            <p
              style={{ fontSize: "12px", color: "#aaa", marginBottom: "10px" }}
            >
              {characterInteraction.character}
            </p>
            <p style={{ fontSize: "14px", fontStyle: "italic" }}>
              {characterInteraction.response}
            </p>
          </div>
        )}

        {/* Add new */}
        <button
          onClick={addContextPiece}
          style={{
            padding: "12px",
            backgroundColor: "#667eea",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ➕ Add Context
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/*
  QUANT COMMAND CENTER
  ====================
  Spatial interface for trading decisions + AI assistance.
  
  The vision: 
  - Market data as spatial terrain you navigate
  - AI analyzes in real-time as you explore
  - One-click actions, zero friction
  - Your spatial intuition meets quant speed
*/

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  x: number;
  y: number;
  category: "major" | "altcoin" | "defi" | "stable";
}

interface Position {
  symbol: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

// Asset names lookup
const ASSET_NAMES: Record<string, string> = {
  BTC: "Bitcoin", ETH: "Ethereum", BNB: "Binance Coin", SOL: "Solana", XRP: "Ripple",
  DOGE: "Dogecoin", ADA: "Cardano", AVAX: "Avalanche", LINK: "Chainlink", DOT: "Polkadot",
  UNI: "Uniswap", AAVE: "Aave", MKR: "Maker", USDT: "Tether", USDC: "USD Coin"
};

// Asset positions on the map
const ASSET_POSITIONS: Record<string, { x: number; y: number; category: "major" | "altcoin" | "defi" | "stable" }> = {
  BTC: { x: 200, y: 250, category: "major" },
  ETH: { x: 280, y: 200, category: "major" },
  BNB: { x: 320, y: 300, category: "major" },
  SOL: { x: 360, y: 180, category: "major" },
  XRP: { x: 150, y: 320, category: "major" },
  DOGE: { x: 550, y: 150, category: "altcoin" },
  ADA: { x: 580, y: 220, category: "altcoin" },
  AVAX: { x: 620, y: 280, category: "altcoin" },
  LINK: { x: 500, y: 250, category: "altcoin" },
  DOT: { x: 540, y: 320, category: "altcoin" },
  UNI: { x: 380, y: 80, category: "defi" },
  AAVE: { x: 450, y: 100, category: "defi" },
  MKR: { x: 420, y: 130, category: "defi" },
};

const CATEGORY_COLORS = {
  major: "#f7931a",    // Bitcoin orange
  altcoin: "#00d4aa",  // Teal
  defi: "#ff6b9d",     // Pink
  stable: "#4ade80",   // Green
};

export default function QuantPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalance] = useState({ usdt: 1000, total: 1000 });
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hoverAsset, setHoverAsset] = useState<Asset | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [binanceConnected, setBinanceConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [providers, setProviders] = useState<{ groq?: boolean; openai?: boolean; google?: boolean }>({});
  const [activeProvider, setActiveProvider] = useState<string>("rule");
  
  const animationRef = useRef<number>(0);

  // Fetch REAL prices from Binance
  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch("/api/quant/prices");
      const data = await response.json();
      
      if (data.success && data.prices) {
        const newAssets: Asset[] = data.prices.map((p: any) => {
          const pos = ASSET_POSITIONS[p.symbol] || { x: 400, y: 300, category: "altcoin" as const };
          return {
            symbol: p.symbol,
            name: ASSET_NAMES[p.symbol] || p.symbol,
            price: p.price,
            change24h: p.change24h,
            volume: p.volume,
            x: pos.x,
            y: pos.y,
            category: pos.category,
          };
        });
        setAssets(newAssets);
        setBinanceConnected(true);
        setLastUpdate(data.timestamp);
      }
    } catch (error) {
      console.error("Failed to fetch prices:", error);
      setBinanceConnected(false);
    }
  }, []);

  // Fetch available AI providers from server
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/quant/provider');
      if (!res.ok) return;
      const data = await res.json();
      setProviders(data.providers || {});
      // choose active provider by priority
      if (data.providers?.groq) setActiveProvider('groq');
      else if (data.providers?.openai) setActiveProvider('openai');
      else if (data.providers?.google) setActiveProvider('google');
      else setActiveProvider('rule');
    } catch (e) {
      console.error('Failed to fetch providers', e);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Fetch prices on mount and every 10 seconds
  useEffect(() => {
    fetchPrices(); // Initial fetch
    const interval = setInterval(fetchPrices, 10000); // Every 10s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // AI Analysis function - Uses server-side GROQ_API_KEY (no manual setup needed!)
  const analyzeAsset = useCallback(async (asset: Asset) => {
    setIsAnalyzing(true);
    setAiAnalysis("");

    try {
      // Call our server-side API that uses env GROQ_API_KEY
      const response = await fetch("/api/quant/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: asset.symbol,
          name: asset.name,
          price: asset.price,
          change24h: asset.change24h,
          volume: asset.volume,
        })
      });

      const data = await response.json();
      setAiAnalysis(data.analysis);
      if (data.source) setActiveProvider(data.source);
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiAnalysis(`📊 ${asset.symbol}\n\nPrice: $${asset.price.toLocaleString()}\n${asset.change24h > 0 ? "📈 Bullish" : "📉 Bearish"}`);
    }
    
    setIsAnalyzing(false);
  }, []);

  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw connections between related assets
    ctx.globalAlpha = 0.1;
    assets.forEach((asset, i) => {
      assets.slice(i + 1).forEach(other => {
        if (asset.category === other.category) {
          ctx.beginPath();
          ctx.strokeStyle = CATEGORY_COLORS[asset.category];
          ctx.lineWidth = 2;
          ctx.moveTo(asset.x, asset.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      });
    });
    ctx.globalAlpha = 1;

    // Draw assets
    assets.forEach(asset => {
      const isSelected = selectedAsset?.symbol === asset.symbol;
      const isHovered = hoverAsset?.symbol === asset.symbol;
      
      // Size based on volume (log scale)
      const baseSize = Math.log10(asset.volume) * 3;
      const size = baseSize * (isSelected ? 1.3 : isHovered ? 1.15 : 1);
      
      // Color based on change
      const intensity = Math.min(Math.abs(asset.change24h) / 10, 1);
      const baseColor = CATEGORY_COLORS[asset.category];
      
      // Glow effect
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(asset.x, asset.y, size + 15, 0, Math.PI * 2);
        ctx.fillStyle = baseColor + "22";
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(asset.x, asset.y, size + 8, 0, Math.PI * 2);
        ctx.fillStyle = baseColor + "44";
        ctx.fill();
      }
      
      // Main circle
      ctx.beginPath();
      ctx.arc(asset.x, asset.y, size, 0, Math.PI * 2);
      
      // Fill color: green for up, red for down
      if (asset.category === "stable") {
        ctx.fillStyle = "#4ade80";
      } else if (asset.change24h > 0) {
        ctx.fillStyle = `rgba(34, 197, 94, ${0.5 + intensity * 0.5})`;
      } else {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + intensity * 0.5})`;
      }
      ctx.fill();
      
      // Border
      ctx.strokeStyle = isSelected ? "#ffffff" : baseColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
      
      // Symbol label
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${12 + size * 0.15}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(asset.symbol, asset.x, asset.y);
      
      // Price below
      ctx.fillStyle = "#aaa";
      ctx.font = "10px monospace";
      ctx.fillText(
        asset.price >= 1 ? `$${asset.price.toFixed(2)}` : `$${asset.price.toFixed(4)}`,
        asset.x,
        asset.y + size + 12
      );
      
      // Change indicator
      const changeColor = asset.change24h > 0 ? "#22c55e" : "#ef4444";
      ctx.fillStyle = changeColor;
      ctx.fillText(
        `${asset.change24h > 0 ? "+" : ""}${asset.change24h.toFixed(1)}%`,
        asset.x,
        asset.y + size + 24
      );
    });

    // Legend
    ctx.fillStyle = "#666";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    
    let legendY = height - 100;
    Object.entries(CATEGORY_COLORS).forEach(([cat, color]) => {
      ctx.fillStyle = color;
      ctx.fillRect(20, legendY, 12, 12);
      ctx.fillStyle = "#888";
      ctx.fillText(cat.toUpperCase(), 40, legendY + 10);
      legendY += 20;
    });

    animationRef.current = requestAnimationFrame(render);
  }, [assets, selectedAsset, hoverAsset]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = Math.min(window.innerWidth - 400, 800);
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Mouse handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Check for hover
    let found: Asset | null = null;
    for (const asset of assets) {
      const dx = x - asset.x;
      const dy = y - asset.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const size = Math.log10(asset.volume) * 3;
      
      if (dist < size + 10) {
        found = asset;
        break;
      }
    }
    setHoverAsset(found);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hoverAsset) {
      setSelectedAsset(hoverAsset);
      analyzeAsset(hoverAsset);
    }
  };

  // Quick trade functions
  const executeTrade = (type: "buy" | "sell", amount: number) => {
    if (!selectedAsset) return;
    
    // Mock trade execution
    console.log(`${type.toUpperCase()} ${amount} USDT of ${selectedAsset.symbol}`);
    
    // Update positions (mock)
    if (type === "buy") {
      setPositions(prev => {
        const existing = prev.find(p => p.symbol === selectedAsset.symbol);
        if (existing) {
          return prev.map(p => 
            p.symbol === selectedAsset.symbol 
              ? { ...p, amount: p.amount + amount / selectedAsset.price }
              : p
          );
        }
        return [...prev, {
          symbol: selectedAsset.symbol,
          amount: amount / selectedAsset.price,
          entryPrice: selectedAsset.price,
          currentPrice: selectedAsset.price,
          pnl: 0,
          pnlPercent: 0,
        }];
      });
      setBalance(prev => ({ ...prev, usdt: prev.usdt - amount }));
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      width: "100vw", 
      height: "100vh",
      background: "#0a0a0f",
      fontFamily: "monospace",
      overflow: "hidden"
    }}>
      {/* Main chart area */}
      <div style={{ flex: 1, position: "relative" }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{ 
            cursor: hoverAsset ? "pointer" : "crosshair",
          }}
        />
        
        {/* Title */}
        <div style={{
          position: "absolute",
          top: 20,
          left: 20,
        }}>
          <h1 style={{ 
            color: "#f7931a", 
            margin: 0, 
            fontSize: "24px",
            textShadow: "0 0 20px #f7931a44"
          }}>
            Quant Command ⚡
          </h1>
          <p style={{ color: "#666", margin: "4px 0", fontSize: "12px" }}>
            Real Binance prices • Click asset for AI analysis
          </p>
          {lastUpdate > 0 && (
            <p style={{ color: "#444", margin: "2px 0", fontSize: "10px" }}>
              Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Connection status */}
        <div style={{
          position: "absolute",
          top: 20,
          right: 420,
          display: "flex",
          gap: 10
        }}>
          <div style={{
            padding: "6px 12px",
            background: binanceConnected ? "#22c55e22" : "#ef444422",
            border: `1px solid ${binanceConnected ? "#22c55e" : "#ef4444"}`,
            borderRadius: 4,
            color: binanceConnected ? "#22c55e" : "#ef4444",
            fontSize: "12px"
          }}>
            {binanceConnected ? "🟢 Binance" : "🔴 Demo Mode"}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: "6px 12px",
              background: "#1a1a2e",
              border: "1px solid #333",
              borderRadius: 4,
              color: "#888",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div style={{
            position: "absolute",
            top: 60,
            right: 420,
            background: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: 8,
            padding: 16,
            width: 280,
            zIndex: 100
          }}>
            <h3 style={{ color: "#fff", margin: "0 0 12px 0", fontSize: "14px" }}>
              ⚙️ Status
            </h3>
            <div style={{ marginBottom: 12, padding: 12, background: "#0a0a0f", borderRadius: 4 }}>
              <div style={{ color: providers.groq ? "#4ade80" : "#888", fontSize: "12px", marginBottom: 4 }}>
                {providers.groq ? '✅ Groq available' : 'Groq not configured'}
              </div>
              <div style={{ color: providers.openai ? "#4ade80" : "#888", fontSize: "12px", marginBottom: 4 }}>
                {providers.openai ? '✅ OpenAI available' : 'OpenAI not configured'}
              </div>
              <div style={{ color: providers.google ? "#4ade80" : "#888", fontSize: "12px" }}>
                {providers.google ? '✅ Google available' : 'Google not configured'}
              </div>
            </div>
            <div style={{ padding: 12, background: "#0a0a0f", borderRadius: 4 }}>
              <div style={{ color: binanceConnected ? "#4ade80" : "#ef4444", fontSize: "12px", marginBottom: 4 }}>
                {binanceConnected ? '🟢 Binance prices' : '🔴 Binance offline'}
              </div>
              <div style={{ color: "#666", fontSize: "11px" }}>
                Add `BINANCE_API_KEY` to `.env` for trading features (server-side)
              </div>
            </div>
            <p style={{ color: "#666", fontSize: "10px", marginTop: 12, textAlign: "center" }}>
              EMA5 strategy = gambling with extra steps 😅
            </p>
          </div>
        )}

        {/* Hover tooltip */}
        {hoverAsset && !selectedAsset && (
          <div style={{
            position: "absolute",
            left: mousePos.x + 20,
            top: mousePos.y - 10,
            background: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: 4,
            padding: "8px 12px",
            pointerEvents: "none"
          }}>
            <div style={{ color: "#fff", fontWeight: "bold" }}>{hoverAsset.name}</div>
            <div style={{ color: "#888", fontSize: "11px" }}>
              Vol: ${(hoverAsset.volume / 1_000_000_000).toFixed(2)}B
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{ 
        width: 400, 
        background: "#0f0f18",
        borderLeft: "1px solid #1a1a2e",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Balance */}
        <div style={{ 
          padding: 16, 
          borderBottom: "1px solid #1a1a2e" 
        }}>
          <div style={{ color: "#888", fontSize: "11px" }}>BALANCE</div>
          <div style={{ color: "#fff", fontSize: "24px", fontWeight: "bold" }}>
            ${balance.total.toLocaleString()}
          </div>
          <div style={{ color: "#4ade80", fontSize: "12px" }}>
            {balance.usdt.toFixed(2)} USDT available
          </div>
        </div>

        {/* Selected asset panel */}
        {selectedAsset ? (
          <div style={{ 
            padding: 16, 
            borderBottom: "1px solid #1a1a2e",
            flex: 1,
            overflow: "auto"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: 12
            }}>
              <div>
                <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold" }}>
                  {selectedAsset.symbol}
                </div>
                <div style={{ color: "#888", fontSize: "12px" }}>
                  {selectedAsset.name}
                </div>
              </div>
              <button
                onClick={() => { setSelectedAsset(null); setAiAnalysis(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "18px"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{ background: "#1a1a2e", padding: 12, borderRadius: 4 }}>
                <div style={{ color: "#888", fontSize: "10px" }}>PRICE</div>
                <div style={{ color: "#fff", fontSize: "18px" }}>
                  ${selectedAsset.price >= 1 
                    ? selectedAsset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : selectedAsset.price.toFixed(4)
                  }
                </div>
              </div>
              <div style={{ background: "#1a1a2e", padding: 12, borderRadius: 4 }}>
                <div style={{ color: "#888", fontSize: "10px" }}>24H CHANGE</div>
                <div style={{ 
                  color: selectedAsset.change24h > 0 ? "#22c55e" : "#ef4444", 
                  fontSize: "18px" 
                }}>
                  {selectedAsset.change24h > 0 ? "+" : ""}{selectedAsset.change24h.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div style={{ 
              background: "#1a1a2e", 
              borderRadius: 8, 
              padding: 12,
              marginBottom: 16,
              minHeight: 120
            }}>
              <div style={{ color: "#888", fontSize: "11px", marginBottom: 8 }}>
                Provider: <strong style={{ color: "#fff" }}>{activeProvider}</strong>
              </div>
              {isAnalyzing ? (
                <div style={{ color: "#888", textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: "24px", marginBottom: 8 }}>🤖</div>
                  Analyzing...
                </div>
              ) : aiAnalysis ? (
                <div style={{ 
                  color: "#ddd", 
                  fontSize: "12px", 
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5
                }}>
                  {aiAnalysis}
                </div>
              ) : (
                <div style={{ color: "#666", textAlign: "center" }}>
                  Click an asset for AI analysis
                </div>
              )}
            </div>

            {/* Quick trade buttons */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: 8 
            }}>
              <button
                onClick={() => executeTrade("buy", 100)}
                style={{
                  padding: "12px",
                  background: "#22c55e22",
                  border: "1px solid #22c55e",
                  borderRadius: 4,
                  color: "#22c55e",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                BUY $100
              </button>
              <button
                onClick={() => executeTrade("sell", 100)}
                style={{
                  padding: "12px",
                  background: "#ef444422",
                  border: "1px solid #ef4444",
                  borderRadius: 4,
                  color: "#ef4444",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                SELL $100
              </button>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr 1fr", 
              gap: 8,
              marginTop: 8
            }}>
              {[50, 250, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => executeTrade("buy", amt)}
                  style={{
                    padding: "8px",
                    background: "#1a1a2e",
                    border: "1px solid #333",
                    borderRadius: 4,
                    color: "#888",
                    cursor: "pointer",
                    fontSize: "11px"
                  }}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ 
            padding: 16, 
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            textAlign: "center"
          }}>
            <div>
              <div style={{ fontSize: "32px", marginBottom: 8 }}>👆</div>
              Click an asset on the map<br />
              for AI-powered analysis
            </div>
          </div>
        )}

        {/* Positions */}
        <div style={{ 
          padding: 16, 
          borderTop: "1px solid #1a1a2e",
          maxHeight: 200,
          overflow: "auto"
        }}>
          <div style={{ color: "#888", fontSize: "11px", marginBottom: 8 }}>
            POSITIONS ({positions.length})
          </div>
          {positions.length === 0 ? (
            <div style={{ color: "#666", fontSize: "12px" }}>
              No open positions
            </div>
          ) : (
            positions.map(pos => (
              <div 
                key={pos.symbol}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #1a1a2e"
                }}
              >
                <div>
                  <div style={{ color: "#fff", fontWeight: "bold" }}>{pos.symbol}</div>
                  <div style={{ color: "#888", fontSize: "11px" }}>
                    {pos.amount.toFixed(6)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    color: pos.pnl >= 0 ? "#22c55e" : "#ef4444",
                    fontWeight: "bold" 
                  }}>
                    {pos.pnl >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(2)}%
                  </div>
                  <div style={{ color: "#888", fontSize: "11px" }}>
                    ${(pos.amount * pos.currentPrice).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: 12, 
          borderTop: "1px solid #1a1a2e",
          color: "#444",
          fontSize: "10px",
          textAlign: "center"
        }}>
          Demo mode • Not financial advice • DYOR
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Link from "next/link";
import "katex/dist/katex.min.css";

interface Props {
  markdown: string;
  latex: string;
}

// Key physics concepts that deserve explain buttons
const EXPLAINABLE_CONCEPTS = [
  { keyword: "fine structure constant", label: "α ≈ 1/137", concept: "The fine structure constant α = e²/(4πε₀ℏc) ≈ 1/137 - why this specific value?" },
  { keyword: "szilard", label: "Szilard's Engine", concept: "Szilard's insight: information has thermodynamic cost - E_min = kT ln 2" },
  { keyword: "entropic gravity", label: "Entropic Gravity", concept: "Entropic gravity: gravity as emergent from information/entropy gradients" },
  { keyword: "lorentz factor", label: "γ Factor", concept: "The Lorentz factor γ = 1/√(1-v²/c²) and relativistic effects near speed of light" },
  { keyword: "probability shift", label: "EM Fields", concept: "Electromagnetic fields as probability distribution shifts in discrete spacetime" },
  { keyword: "discrete spacetime", label: "Discrete Spacetime", concept: "Spacetime as discrete cellular automaton rather than continuous manifold" },
  { keyword: "landauer", label: "Landauer Limit", concept: "Landauer's principle: minimum energy cost of computation and bit erasure" },
  { keyword: "speed of light", label: "c = 3×10⁸", concept: "The speed of light as the fundamental ratio of space to time in our universe" },
];

export default function InteractiveCV({ markdown, latex }: Props) {
  const [query, setQuery] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [activeConcept, setActiveConcept] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onSearch = () => {
    if (!query) return;
    const node = containerRef.current?.querySelector(".cv-content");
    if (!node) return;
    const text = query.toLowerCase();
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      if ((n.nodeValue || "").toLowerCase().includes(text)) {
        const parent = n.parentElement;
        parent?.scrollIntoView({ behavior: "smooth", block: "center" });
        parent?.classList.add("cv-search-highlight");
        setTimeout(() => parent?.classList.remove("cv-search-highlight"), 2000);
        break;
      }
    }
  };

  const downloadLatex = () => {
    const blob = new Blob([latex], { type: "text/x-tex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cv.tex";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyLatex = async () => {
    await navigator.clipboard.writeText(latex);
    alert("LaTeX copied to clipboard");
  };

  const printPDF = () => {
    window.print();
  };

  // AI Explain function - using the new general-purpose explain API
  const explainConcept = useCallback(async (concept: string) => {
    setActiveConcept(concept);
    setIsExplaining(true);
    setAiExplanation("");

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: concept,
          context: "From Illia Dorosh's CV - physics research on entropic gravity, discrete spacetime, and energy systems"
        })
      });

      const data = await response.json();
      setAiExplanation(data.explanation || data.error || "No explanation available");
    } catch (error) {
      console.error("AI explanation error:", error);
      setAiExplanation("Could not connect to AI. Key insight: Szilard showed information has thermodynamic cost - erasing 1 bit costs at least kT ln 2 energy.");
    }
    
    setIsExplaining(false);
  }, []);

  // Handle text selection
  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
      setSelectedText(selection.toString().trim());
    }
  }, []);

  // Check which concepts are present in the markdown
  const presentConcepts = useMemo(() => {
    const lower = markdown.toLowerCase();
    return EXPLAINABLE_CONCEPTS.filter(c => lower.includes(c.keyword.toLowerCase()));
  }, [markdown]);

  const rendered = useMemo(() => (
    <div className="cv-content" onMouseUp={handleTextSelect}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  ), [markdown, handleTextSelect]);

  return (
    <div ref={containerRef} style={{ display: "flex", gap: 40, flexDirection: "column" }}>
      {/* Minimal search bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "center", background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12, flexWrap: "wrap" }}>
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search in CV..." 
          style={{ 
            padding: "12px 16px", 
            flex: 1, 
            minWidth: 200,
            background: "transparent", 
            border: "none", 
            color: "#fff",
            fontSize: "1rem",
            outline: "none"
          }} 
        />
        <button onClick={onSearch} style={{ padding: "8px 20px", background: "#00ffaa", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Find</button>
        <Link href="/cv/cover-letters" style={{ padding: "8px 20px", background: "#764ba2", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", textDecoration: "none" }}>📝 Cover Letters</Link>
        <button onClick={printPDF} style={{ padding: "8px 20px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Print PDF</button>
      </div>

      {/* Concept Explain Buttons - Near the formulas */}
      {presentConcepts.length > 0 && (
        <div style={{ 
          background: "rgba(118, 75, 162, 0.1)", 
          border: "1px solid rgba(118, 75, 162, 0.3)", 
          borderRadius: 12, 
          padding: 16,
          marginBottom: 10
        }}>
          <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: 12 }}>
            🧠 Click to understand the physics behind these concepts:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {presentConcepts.map((c) => (
              <button
                key={c.keyword}
                onClick={() => explainConcept(c.concept)}
                disabled={isExplaining}
                style={{ 
                  padding: "8px 14px", 
                  background: activeConcept === c.concept ? "#764ba2" : "rgba(118, 75, 162, 0.3)", 
                  color: "#fff", 
                  border: activeConcept === c.concept ? "2px solid #a855f7" : "1px solid rgba(118, 75, 162, 0.5)", 
                  borderRadius: 8, 
                  cursor: isExplaining ? "wait" : "pointer",
                  fontSize: "0.85rem",
                  fontFamily: "monospace",
                  transition: "all 0.2s"
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected text explain */}
      {selectedText && (
        <div style={{ 
          background: "rgba(0, 255, 170, 0.05)", 
          border: "1px solid rgba(0, 255, 170, 0.2)", 
          borderRadius: 8, 
          padding: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10
        }}>
          <span style={{ color: "#aaa", fontSize: "0.85rem" }}>
            Selected: <em style={{ color: "#fff" }}>"{selectedText.slice(0, 60)}{selectedText.length > 60 ? "..." : ""}"</em>
          </span>
          <button 
            onClick={() => explainConcept(selectedText)} 
            disabled={isExplaining}
            style={{ padding: "6px 14px", background: "#00ffaa", color: "#000", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
          >
            Explain This
          </button>
          <button 
            onClick={() => setSelectedText("")} 
            style={{ padding: "6px 10px", background: "transparent", color: "#888", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* AI Explanation Panel - appears when explaining */}
      {(aiExplanation || isExplaining) && (
        <div style={{ 
          background: "linear-gradient(135deg, rgba(118, 75, 162, 0.15), rgba(0, 255, 170, 0.05))", 
          border: "1px solid rgba(118, 75, 162, 0.4)", 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 10,
          position: "relative"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#764ba2", fontWeight: "bold", fontSize: "0.9rem" }}>
              🧠 {isExplaining ? "Thinking..." : "AI Explanation"}
            </span>
            {aiExplanation && (
              <button 
                onClick={() => { setAiExplanation(""); setActiveConcept(""); }} 
                style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}
              >
                ✕
              </button>
            )}
          </div>
          {isExplaining ? (
            <div style={{ color: "#aaa", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="loading-pulse">⏳</span> Connecting to AI...
            </div>
          ) : (
            <div style={{ color: "#e0e0e0", lineHeight: 1.8, whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
              {aiExplanation}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 40 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", padding: 40, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="cv-content" style={{ color: "#e0e0e0", fontSize: "1.05rem", lineHeight: 1.7 }}>{rendered}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ padding: 20, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 10, fontFamily: "monospace" }}>LaTeX Source</div>
            <pre style={{ 
              whiteSpace: "pre-wrap", 
              maxHeight: "400px", 
              overflow: "auto", 
              background: "#000", 
              color: "#00ffaa", 
              padding: 16, 
              borderRadius: 8,
              fontSize: "0.8rem",
              fontFamily: "monospace"
            }}>{latex}</pre>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={copyLatex} style={{ flex: 1, padding: 16, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", transition: "background 0.2s" }}>Copy LaTeX</button>
            <button onClick={downloadLatex} style={{ flex: 1, padding: 16, background: "#00ffaa", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", transition: "transform 0.2s" }}>Download .tex</button>
          </div>

          <div style={{ padding: 20, background: "rgba(0, 255, 170, 0.05)", borderRadius: 12, color: "#aaa", fontSize: "0.9rem", border: "1px solid rgba(0, 255, 170, 0.1)" }}>
            <div style={{ marginBottom: 8, color: "#00ffaa", fontWeight: "bold" }}>Why this format?</div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 4 }}>Machine readable & searchable</li>
              <li style={{ marginBottom: 4 }}>Source code available (LaTeX)</li>
              <li>Demonstrates parsing & rendering</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cv-search-highlight { background: rgba(0, 255, 170, 0.2); border-radius: 4px; }
        .cv-content :global(h1) { font-size: 2.5rem; margin-bottom: 1rem; color: #fff; }
        .cv-content :global(h2) { font-size: 1.8rem; margin-top: 2rem; margin-bottom: 1rem; color: #00ffaa; border-bottom: 1px solid rgba(0,255,170,0.2); padding-bottom: 0.5rem; }
        .cv-content :global(h3) { font-size: 1.3rem; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #fff; }
        .cv-content :global(p) { margin-bottom: 1rem; }
        .cv-content :global(ul) { margin-bottom: 1rem; padding-left: 1.5rem; }
        .cv-content :global(li) { margin-bottom: 0.5rem; }
        .cv-content :global(strong) { color: #fff; font-weight: 600; }
        .cv-content :global(blockquote) { border-left: 3px solid #00ffaa; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #aaa; }
        .cv-content :global(hr) { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 2rem 0; }
        .cv-content :global(.katex) { color: #00ffaa; font-size: 1.1em; }
        .cv-content :global(.katex-display) { margin: 1.5rem 0; padding: 1rem; background: rgba(0,255,170,0.05); border-radius: 8px; overflow-x: auto; }
        .loading-pulse { animation: pulse 1s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

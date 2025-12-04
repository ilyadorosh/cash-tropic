"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface PhysicsExplainerProps {
  title?: string;
  content: string;
  equations?: {
    name: string;
    latex: string;
    description: string;
  }[];
  className?: string;
}

/**
 * PhysicsExplainer renders LaTeX equations with explanations
 * Uses the existing remark-math and rehype-katex dependencies
 */
export function PhysicsExplainer({
  title,
  content,
  equations = [],
  className = "",
}: PhysicsExplainerProps) {
  return (
    <div
      className={`physics-explainer ${className}`}
      style={{
        background: "rgba(10, 10, 26, 0.95)",
        borderRadius: "12px",
        padding: "20px",
        color: "#e0e0e0",
        fontFamily:
          "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
        border: "1px solid rgba(100, 100, 255, 0.2)",
        backdropFilter: "blur(10px)",
      }}
    >
      {title && (
        <h2
          style={{
            color: "#88aaff",
            marginTop: 0,
            marginBottom: "16px",
            fontSize: "1.5rem",
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
      )}

      <div style={{ marginBottom: "20px" }}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>

      {equations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {equations.map((eq, index) => (
            <div
              key={index}
              style={{
                background: "rgba(50, 50, 80, 0.4)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid rgba(100, 100, 255, 0.15)",
              }}
            >
              <h4
                style={{
                  color: "#aaccff",
                  margin: "0 0 8px 0",
                  fontSize: "1rem",
                }}
              >
                {eq.name}
              </h4>
              <div
                style={{
                  fontSize: "1.25rem",
                  textAlign: "center",
                  margin: "12px 0",
                  padding: "12px",
                  background: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "6px",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {`$$${eq.latex}$$`}
                </ReactMarkdown>
              </div>
              <p
                style={{
                  color: "#aaa",
                  margin: 0,
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                {eq.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Preset physics explanations
export const PHYSICS_PRESETS = {
  entropy: {
    title: "Entropy & Information",
    content: `
**Entropy** is the measure of disorder in a system, but more fundamentally, 
it represents the amount of **information** needed to describe a system's microstate.

The connection between thermodynamics and information theory is deep and profound.
    `,
    equations: [
      {
        name: "Boltzmann Entropy",
        latex: "S = k_B \\ln \\Omega",
        description:
          "Where S is entropy, k_B is Boltzmann's constant, and Ω is the number of microstates. This bridges statistical mechanics with thermodynamics.",
      },
      {
        name: "Shannon Information Entropy",
        latex: "H = -\\sum_{i} p_i \\log_2 p_i",
        description:
          "Information entropy measures the average information content. The mathematical form is identical to Boltzmann entropy, revealing the deep connection between physics and information.",
      },
      {
        name: "Landauer's Principle",
        latex: "E_{min} = k_B T \\ln 2",
        description:
          "Erasing one bit of information requires a minimum energy of k_B T ln(2). This proves that information is physical.",
      },
    ],
  },

  temperature: {
    title: "Temperature as Statistical Equalizer",
    content: `
**Temperature** is not just a measure of "hotness" — it's a statistical property 
that describes how energy is distributed among particles in thermal equilibrium.

At the same temperature, all degrees of freedom share energy equally 
(equipartition theorem).
    `,
    equations: [
      {
        name: "Kinetic Theory Definition",
        latex: "\\frac{1}{2}m\\langle v^2 \\rangle = \\frac{3}{2}k_B T",
        description:
          "Temperature is proportional to the average kinetic energy per particle. This is the statistical mechanical definition of temperature.",
      },
      {
        name: "Boltzmann Distribution",
        latex: "P(E) = \\frac{1}{Z} e^{-E/k_B T}",
        description:
          "The probability of finding a system in state with energy E. Temperature determines how energy states are populated.",
      },
      {
        name: "Equipartition Theorem",
        latex: "\\langle E \\rangle = \\frac{f}{2}k_B T",
        description:
          "Each degree of freedom f contributes (1/2)k_B T to average energy. Temperature equalizes energy distribution.",
      },
    ],
  },

  energy: {
    title: "Energy-Information Equivalence",
    content: `
**Energy is information.** Every physical process that transforms energy 
also transforms information. The universe computes through physics.

This insight connects thermodynamics, computation, and the foundations of reality.
    `,
    equations: [
      {
        name: "Mass-Energy Equivalence",
        latex: "E = mc^2",
        description:
          "Einstein's famous equation shows that mass is a form of concentrated energy. Matter is frozen energy.",
      },
      {
        name: "Free Energy",
        latex: "F = U - TS",
        description:
          "Free energy F equals internal energy U minus temperature times entropy. It represents the energy available to do useful work.",
      },
      {
        name: "Information Processing Cost",
        latex: "\\Delta S_{universe} \\geq \\frac{k_B}{T} \\cdot W_{computed}",
        description:
          "Computation has a thermodynamic cost. Processing information generates entropy.",
      },
    ],
  },
};

export default PhysicsExplainer;

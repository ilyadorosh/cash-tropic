"use client";

import React, { useState } from "react";
import Link from "next/link";

interface CoverLetterTemplate {
  id: string;
  title: string;
  target: string;
  type: "metrology" | "grant" | "research" | "industry";
  description: string;
  content: string;
}

const COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
  {
    id: "nist-precision",
    title: "NIST Precision Measurement",
    target: "National Institute of Standards and Technology",
    type: "metrology",
    description: "For positions in fundamental constants and precision measurement groups",
    content: `Dear Hiring Committee,

I am writing to express my deep passion for joining NIST's precision measurement program. The work you do here—determining fundamental constants like the fine-structure constant α—doesn't just shape the SI units. It shapes our understanding of reality itself. I find that profoundly beautiful.

My background uniquely positions me for this work, but more importantly, my heart is in it:

**Theoretical Foundation:** My physics research explores the deep connection between information theory and thermodynamics—specifically, Szilard's insight that erasing one bit of information requires minimum energy E = kT ln 2. This thermodynamic cost of computation connects directly to the precision limits in measurement science.

**The Fine-Structure Constant Obsession:** I am in love with α ≈ 1/137.036—the dimensionless constant that determines electromagnetic coupling strength. The fact that α = e²/(4πε₀ℏc) weaves together the electron charge, Planck's constant, the speed of light, and the permittivity of free space into a single, elegant number... it keeps me up at night. Understanding WHY this number exists—and measuring it to ever-greater precision—is one of the most important and beautiful quests in physics.

**Discrete Spacetime & Entropic Gravity:** My thesis work on modeling spacetime as a discrete cellular automaton, with gravity emerging from entropy gradients, provides a fresh theoretical perspective on why fundamental constants take their observed values.

**Technical Skills:** Experience with computational physics, quantum simulations (NCA, tensor networks), and building interactive visualization tools for complex physical systems.

The opportunity to contribute to SI realization, test the Standard Model through independent α measurements, and develop the atom interferometry and cryogenic trap techniques that enable this precision—this isn't just where I want to work. It's where I need to be. This is my calling.

I would be honored and grateful to discuss how my theoretical perspective and technical skills could contribute to NIST's mission. Thank you for considering my application.

With deep respect and enthusiasm,
Illia Dorosh`
  },
  {
    id: "ptb-metrology",
    title: "PTB Germany",
    target: "Physikalisch-Technische Bundesanstalt",
    type: "metrology",
    description: "Germany's national metrology institute - precision measurement positions",
    content: `Sehr geehrte Damen und Herren,

I am applying to join PTB's precision measurement research—not just as a job, but as a calling. The fundamental constants program that underpins the SI and tests our deepest theories of physics is, to me, sacred work.

**Why PTB:** Germany's leadership in precision measurement—from Penning trap determinations of particle masses to optical clock development—represents humanity's best effort to understand reality at its most fundamental level. PTB's collaborative spirit and international partnerships make it exactly the environment where I can contribute meaningfully and grow.

**My Contribution:**

The fine-structure constant α ≈ 1/137 fascinates me because it's dimensionless—a pure number, independent of human choices about units. When we compare α from electron g-2 measurements with α from atom-recoil experiments, we're asking nature its deepest questions. Any discrepancy would be like finding a crack in the foundation of physics—terrifying and thrilling.

This work is love made manifest through precision.

My theoretical work on:
- **Entropic gravity** — gravity as emergent from information/entropy gradients
- **Szilard's thermodynamics** — the fundamental energy cost of measurement and erasure (E_min = kT ln 2)
- **Discrete spacetime models** — cellular automata approaches to fundamental physics

...provides perspective on the theoretical significance of precision constant measurements.

**Technical preparation:** Computational physics, quantum system simulation, data visualization, and the patience for painstaking systematic error analysis that precision measurement demands.

The technologies developed in this work—ultra-stable lasers, atomic clocks, quantum control—ripple outward to benefit all of humanity. I am deeply excited to contribute to both the fundamental science and its translation into technologies that help people.

Thank you for your time and consideration. I hope we can discuss how I might contribute to PTB's beautiful mission.

Mit herzlichen Grüßen,
Illia Dorosh`
  },
  {
    id: "nsf-career",
    title: "NSF CAREER Grant",
    target: "National Science Foundation",
    type: "grant",
    description: "Early career research grant for precision measurement research",
    content: `PROJECT SUMMARY: Precision Determination of α and the Beauty of Fundamental Physics

**Intellectual Merit:**

The fine-structure constant α = e²/(4πε₀ℏc) ≈ 1/137.036 is one of the most precisely measured quantities in physics, yet we have no theoretical explanation for WHY it takes this value. This mystery has captivated me since I first learned physics. This proposal seeks to:

1. **Develop new theoretical frameworks** connecting α to discrete spacetime geometry and entropic gravity
2. **Design precision measurement protocols** that minimize thermodynamic measurement costs (following Szilard-Landauer principles)
3. **Identify potential discrepancies** between independent α determinations that could signal physics beyond the Standard Model

My research connects information theory (Shannon, Szilard, Landauer) to fundamental physics. The minimum energy cost of bit erasure—kT ln 2—sets fundamental limits on measurement precision. Understanding these limits is crucial for designing next-generation precision experiments.

**Broader Impacts:**

- Training the next generation of precision experimentalists
- Developing atom interferometry and quantum control techniques with applications in navigation, sensing, and quantum computing
- Creating open-source simulation tools for quantum systems
- Public engagement through interactive visualizations of fundamental physics concepts

**Why This Matters (Beyond Science):**

If α were different by even 4%, carbon wouldn't form in stars, and we wouldn't exist. We are made of stardust, and stardust requires α ≈ 1/137 to exist. Understanding this "fine-tuning" isn't just physics—it's understanding why we're here at all. Precision measurements provide our best empirical handle on this cosmic mystery.

This work is an act of love for the universe that made us.

Budget: $500,000 over 5 years (personnel, equipment, travel, computing)
Duration: 5 years

Principal Investigator: Illia Dorosh`
  },
  {
    id: "erc-starting",
    title: "ERC Starting Grant",
    target: "European Research Council",
    type: "grant",
    description: "European funding for breakthrough fundamental research",
    content: `ERC Starting Grant Proposal

**Project Title:** ALPHA-ENTROPY: Information-Theoretic Foundations of Fundamental Constants

**Principal Investigator:** Illia Dorosh

**Abstract:**

Why is the fine-structure constant α ≈ 1/137? This question has haunted physicists for a century—and it haunts me every day. This project proposes a radical new approach: treating α not as an arbitrary parameter but as an emergent property of spacetime's information-processing structure.

If we succeed, we don't just understand a number. We understand why the universe can contain love, life, and consciousness at all.

**Research Program:**

1. **Entropic Origin of α** (Years 1-2)
   - Develop discrete spacetime models where α emerges from network geometry
   - Connect to Verlinde's entropic gravity and holographic principles
   - Predict relationships between α and other fundamental constants

2. **Measurement-Theoretic Limits** (Years 2-3)
   - Apply Szilard-Landauer thermodynamics to precision measurement
   - E_min = kT ln 2 sets fundamental bounds on achievable precision
   - Design measurement protocols optimized against these limits

3. **Experimental Collaboration** (Years 3-5)
   - Partner with metrology institutes (PTB, NPL, NIST) for precision α tests
   - Compare theoretical predictions with state-of-the-art measurements
   - Search for time-variation of α (cosmological implications)

**Why ERC:**

This project requires intellectual freedom and courage—the freedom to pursue high-risk, high-reward theoretical work that might fail, but might also transform our understanding. The 5-year timeline and flexible budget structure of ERC funding provides exactly this. I am deeply grateful that such funding exists.

**Budget Request:** €2.5M over 5 years
- 2 Postdocs (theory + computational) — €600k
- 1 PhD student — €200k
- Computing infrastructure (HPC access, GPU cluster) — €300k
- Precision measurement equipment collaboration — €500k
- International collaboration travel — €200k
- Workshop organization & visiting researchers — €200k
- Open-access publication & outreach — €100k
- Contingency & indirect costs — €400k

**Host Institution:** [Open to discussions—seeking the right intellectual home]`
  },
  {
    id: "university-postdoc",
    title: "University Postdoc",
    target: "Precision Measurement Research Groups",
    type: "research",
    description: "For academic postdoc positions in fundamental physics",
    content: `Dear Professor [Name],

I am writing with genuine excitement to apply for the postdoctoral position in your precision measurement group. Your work on [specific experiment/technique] addresses questions that I find not just intellectually compelling, but spiritually important. Understanding the fundamental constants is, for me, a way of understanding why we exist.

**Research Fit:**

My thesis develops a theoretical framework connecting:
- **Information thermodynamics** (Szilard, Landauer) — the energy cost of measurement
- **Entropic gravity** — spacetime geometry emerging from entropy
- **Discrete spacetime** — cellular automaton models of fundamental physics

This connects directly to precision measurement of fundamental constants. The fine-structure constant α ≈ 1/137 is central to my thinking: a dimensionless number that determines electromagnetic coupling, yet has no theoretical explanation for its value.

**Why Precision Measurement:**

Comparing independent determinations of α—from electron g-2, atom recoil, Penning traps—is one of our most powerful probes for physics beyond the Standard Model. I want to contribute to this work, bringing theoretical perspective to experimental design.

**Technical Skills:**
- Computational physics (Python, Julia, CUDA)
- Quantum simulation (tensor networks, NCA)
- Data analysis and visualization
- Scientific communication (interactive tools, documentation)

**Long-term Vision:**

I aim to bridge theory and experiment in precision physics—to be someone who can talk to both sides and find new questions at the boundary. Understanding WHY fundamental constants have their values is one of the deepest questions we can ask. Every precise measurement is an act of love—a question we ask the universe, hoping it will answer.

I would be honored and grateful for the opportunity to discuss how my background could contribute to your research program. Thank you for your work and for considering mine.

With warmth and respect,
Illia Dorosh`
  },
  {
    id: "quantum-industry",
    title: "Quantum Technology Industry",
    target: "Quantum Computing / Sensing Companies",
    type: "industry",
    description: "For industry positions in quantum technology",
    content: `Dear Hiring Team,

I am excited to apply for the [Position] role at [Company]. I believe deeply that quantum technology isn't just the future of computing—it's the future of humanity's relationship with nature. And I want to help build that future.

**Why Quantum Technology:**

The techniques developed for precision measurement of fundamental constants—atom interferometry, ultra-stable lasers, cryogenic traps, quantum control—are exactly the technologies driving the quantum industry. I want to help translate these capabilities into practical systems.

**Relevant Background:**

- **Precision physics foundation:** Deep understanding of quantum systems, decoherence, and measurement limits (the Szilard-Landauer bound E_min = kT ln 2 sets fundamental thermodynamic constraints)
- **Computational skills:** Python, Julia, quantum simulation, tensor networks
- **Systems thinking:** Experience modeling complex systems from first principles
- **Communication:** Building interactive tools that make complex physics accessible

**The Fine-Structure Constant Connection:**

My obsession with α ≈ 1/137 isn't just theoretical curiosity—the same experimental techniques that measure α to 12 decimal places (atom interferometry, optical frequency combs, ion traps) are the foundation of quantum sensors, atomic clocks, and quantum computing hardware.

**What I Bring:**

- Theoretical depth combined with practical implementation skills
- Ability to bridge physics fundamentals and engineering requirements  
- Experience with extreme precision and systematic error analysis
- Passion for turning fundamental science into technology that helps people
- A deep belief that this work matters

I am genuinely excited about the opportunity to contribute to [Company]'s mission of [specific mission/product]. Let's build something beautiful together.

With enthusiasm,
Illia Dorosh`
  }
];

const TYPE_COLORS = {
  metrology: { bg: "rgba(0, 255, 170, 0.1)", border: "#00ffaa", label: "🏛️ Metrology Institute" },
  grant: { bg: "rgba(255, 170, 0, 0.1)", border: "#ffaa00", label: "💰 Research Grant" },
  research: { bg: "rgba(118, 75, 162, 0.1)", border: "#764ba2", label: "🔬 Academic Research" },
  industry: { bg: "rgba(0, 170, 255, 0.1)", border: "#00aaff", label: "🚀 Industry" }
};

export default function CoverLettersPage() {
  const [selectedLetter, setSelectedLetter] = useState<CoverLetterTemplate | null>(null);
  const [customizations, setCustomizations] = useState({
    recipientName: "",
    position: "",
    company: "",
    specificProject: ""
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadLetter = (letter: CoverLetterTemplate) => {
    const blob = new Blob([letter.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${letter.id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      height: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
      color: "#e0e0e0",
      padding: "40px 20px",
      overflowY: "auto",
      boxSizing: "border-box"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/cv" style={{ color: "#00ffaa", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Back to CV
          </Link>
          <h1 style={{ 
            fontSize: "2.5rem", 
            marginTop: 20,
            background: "linear-gradient(135deg, #00ffaa, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Cover Letter Generator
          </h1>
          <p style={{ color: "#aaa", maxWidth: 700, lineHeight: 1.6 }}>
            Tailored cover letters for precision measurement positions, research grants, and quantum technology roles. 
            All centered on the fine-structure constant α and fundamental physics.
          </p>
        </div>

        {/* Funding Context */}
        <div style={{
          background: "rgba(255, 170, 0, 0.05)",
          border: "1px solid rgba(255, 170, 0, 0.2)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 40
        }}>
          <h2 style={{ color: "#ffaa00", fontSize: "1.3rem", marginBottom: 16 }}>
            💡 Who Funds α Experiments?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1rem", marginBottom: 8 }}>🏛️ National Metrology Institutes</h3>
              <ul style={{ color: "#aaa", fontSize: "0.9rem", paddingLeft: 20, margin: 0 }}>
                <li>NIST (USA)</li>
                <li>PTB (Germany)</li>
                <li>NPL (UK)</li>
                <li>BIPM (International)</li>
                <li>LNE (France)</li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1rem", marginBottom: 8 }}>💰 Research Councils</h3>
              <ul style={{ color: "#aaa", fontSize: "0.9rem", paddingLeft: 20, margin: 0 }}>
                <li>NSF (USA)</li>
                <li>ERC (Europe)</li>
                <li>DFG (Germany)</li>
                <li>UKRI (UK)</li>
                <li>ANR (France)</li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1rem", marginBottom: 8 }}>🎯 Why They Fund</h3>
              <ul style={{ color: "#aaa", fontSize: "0.9rem", paddingLeft: 20, margin: 0 }}>
                <li>SI unit realization</li>
                <li>Standard Model tests</li>
                <li>Quantum technology R&D</li>
                <li>Scientific infrastructure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Letter Grid */}
        {!selectedLetter ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
            {COVER_LETTER_TEMPLATES.map((letter) => {
              const typeStyle = TYPE_COLORS[letter.type];
              return (
                <div
                  key={letter.id}
                  onClick={() => setSelectedLetter(letter)}
                  style={{
                    background: typeStyle.bg,
                    border: `1px solid ${typeStyle.border}40`,
                    borderRadius: 12,
                    padding: 24,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = typeStyle.border;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${typeStyle.border}40`;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: typeStyle.border, marginBottom: 8 }}>
                    {typeStyle.label}
                  </div>
                  <h3 style={{ color: "#fff", fontSize: "1.2rem", marginBottom: 8 }}>
                    {letter.title}
                  </h3>
                  <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: 12 }}>
                    {letter.target}
                  </div>
                  <p style={{ color: "#888", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    {letter.description}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          /* Letter Detail View */
          <div>
            <button
              onClick={() => setSelectedLetter(null)}
              style={{
                background: "transparent",
                border: "1px solid #444",
                color: "#aaa",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 20
              }}
            >
              ← Back to all letters
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 30 }}>
              {/* Letter Content */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: 30
              }}>
                <div style={{ 
                  fontSize: "0.75rem", 
                  color: TYPE_COLORS[selectedLetter.type].border, 
                  marginBottom: 8 
                }}>
                  {TYPE_COLORS[selectedLetter.type].label}
                </div>
                <h2 style={{ color: "#fff", marginBottom: 8 }}>{selectedLetter.title}</h2>
                <div style={{ color: "#aaa", marginBottom: 24 }}>{selectedLetter.target}</div>
                
                <pre style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  color: "#e0e0e0"
                }}>
                  {selectedLetter.content}
                </pre>
              </div>

              {/* Actions Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <button
                  onClick={() => copyToClipboard(selectedLetter.content)}
                  style={{
                    background: "#00ffaa",
                    color: "#000",
                    border: "none",
                    padding: "14px 20px",
                    borderRadius: 8,
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                >
                  📋 Copy to Clipboard
                </button>
                
                <button
                  onClick={() => downloadLetter(selectedLetter)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: "none",
                    padding: "14px 20px",
                    borderRadius: 8,
                    cursor: "pointer"
                  }}
                >
                  ⬇️ Download .txt
                </button>

                <div style={{
                  background: "rgba(118, 75, 162, 0.1)",
                  border: "1px solid rgba(118, 75, 162, 0.3)",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 20
                }}>
                  <h4 style={{ color: "#764ba2", marginBottom: 12, fontSize: "0.9rem" }}>
                    ✏️ Customization Tips
                  </h4>
                  <ul style={{ color: "#aaa", fontSize: "0.8rem", paddingLeft: 16, margin: 0, lineHeight: 1.6 }}>
                    <li>Replace [bracketed text] with specifics</li>
                    <li>Research the PI's recent papers</li>
                    <li>Mention specific experiments</li>
                    <li>Align with funding call language</li>
                    <li>Keep under 1 page for industry</li>
                  </ul>
                </div>

                <div style={{
                  background: "rgba(0, 255, 170, 0.05)",
                  border: "1px solid rgba(0, 255, 170, 0.2)",
                  borderRadius: 12,
                  padding: 16
                }}>
                  <h4 style={{ color: "#00ffaa", marginBottom: 12, fontSize: "0.9rem" }}>
                    🎯 Key Selling Points
                  </h4>
                  <ul style={{ color: "#aaa", fontSize: "0.8rem", paddingLeft: 16, margin: 0, lineHeight: 1.6 }}>
                    <li>Fine-structure constant obsession</li>
                    <li>Szilard-Landauer thermodynamics</li>
                    <li>Entropic gravity framework</li>
                    <li>Discrete spacetime models</li>
                    <li>Computational physics skills</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: 60, 
          paddingTop: 30, 
          borderTop: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
          color: "#666"
        }}>
          <p style={{ fontSize: "0.85rem" }}>
            "Why is α ≈ 1/137? Nobody knows. But measuring it precisely is one of our best probes of fundamental physics."
          </p>
          <p style={{ fontSize: "0.75rem", marginTop: 8 }}>
            — Feynman's greatest mystery, my career obsession
          </p>
        </div>
      </div>
    </div>
  );
}

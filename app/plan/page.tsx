"use client";

import React, { useState, useRef } from "react";
import styles from "../components/home.module.scss";
import planStyles from "./plan.module.scss";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const legoColors = [
  "#FFADAD", // light red
  "#FFD6A5", // orange
  "#FDFFB6", // yellow
  "#CAFFBF", // green
  "#9BF6FF", // cyan
  "#A0C4FF", // blue
  "#BDB2FF", // purple
  "#FFC6FF", // pink
];

const blockMeta = [
  { label: "proof", icon: "✓", color: "#22c55e" },
  { label: "thesis", icon: "◆", color: "#f59e0b" },
  { label: "learning", icon: "↻", color: "#3b82f6" },
  { label: "control", icon: "⌁", color: "#8b5cf6" },
  { label: "hardware", icon: "⚡", color: "#ef4444" },
  { label: "physics", icon: "∑", color: "#06b6d4" },
  { label: "scale", icon: "↗", color: "#ec4899" },
  { label: "economics", icon: "◎", color: "#f97316" },
  { label: "principles", icon: "★", color: "#14b8a6" },
  { label: "memory", icon: "▦", color: "#6366f1" },
  { label: "entropy", icon: "≈", color: "#a855f7" },
  { label: "life", icon: "✣", color: "#84cc16" },
];

const markdownComponents = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      {...props}
      style={{
        marginBottom: "12px",
        color: "inherit",
        fontWeight: 500,
        lineHeight: 1.5,
      }}
    />
  ),
  ul: ({
    ordered: _ordered,
    node: _node,
    ...props
  }: React.HTMLAttributes<HTMLUListElement> & {
    ordered?: boolean;
    node?: unknown;
  }) => (
    <ul
      {...props}
      style={{ margin: "12px 0 0 20px", color: "inherit", fontWeight: 500 }}
    />
  ),
  li: ({
    ordered: _ordered,
    index: _index,
    node: _node,
    ...props
  }: React.HTMLAttributes<HTMLLIElement> & {
    ordered?: boolean;
    index?: number;
    node?: unknown;
  }) => <li {...props} style={{ marginBottom: "8px" }} />,
  code: ({
    inline: _inline,
    node: _node,
    ...props
  }: React.HTMLAttributes<HTMLElement> & {
    inline?: boolean;
    node?: unknown;
  }) => (
    <code
      {...props}
      style={{
        background: "rgba(255,255,255,0.7)",
        padding: "2px 6px",
        borderRadius: "4px",
        border: "2px solid #111",
        fontWeight: "bold",
        color: "#111",
      }}
    />
  ),
};

const focusAreas = [
  "Real-time learning systems",
  "Transfer learning via LoRA and localized updates",
  "Neuroscience-inspired architectures",
  "Control theory for robust adaptation",
  "Physics-aware computing infrastructure",
  "Cryogenic energy + compute integration",
];

const mission = `
Build a research and engineering platform around a simple thesis: the next step is not just bigger models, but systems that maximize

$$\\frac{\\text{capability}}{\\text{energy} \\times \\text{latency} \\times \\text{fragility}}$$
`;

const sections = [
  {
    title: "Evidence: What Already Runs",
    content: `
Per the Fifth Commandment below: *ship or it didn't happen.* This plan was not written before the work — the receipts exist and run:

- **KAM theory meets Hamiltonian Neural Networks** — single-author paper: the flow learned by an HNN is the *exact* flow of a perturbed Hamiltonian, so KAM/Nekhoroshev theory bounds which invariant structures survive training. Stability of learned dynamics, proven rather than hoped. [Paper (PDF)](/papers/kam-hnn.pdf) · [interactive kicked-rotor demo](/kam)
- **Trained Neural Cellular Automata** — learned local rules regenerating target morphologies under damage, running on GPU in the browser. [Live](/nca)
- **actinlove.com** — the working laboratory: real-time 3D simulation with relativistic rendering, LLM-driven agents with persistent memory, Postgres-backed anonymous state. Every claim in this plan has a runnable ancestor here.

The strategy is *thesis first*, not *startup first*: use the EXIST stipendium to close the gap between "trained an NCA" and "measured $E_{\\text{cell}} / k_B T \\ln 2$ for an NCA" — then decide whether the output is a lab, a company, or a platform.
`,
  },
  {
    title: "Unique Value Proposition",
    content: `
The core thesis is that intelligence should be treated as a coupled system of learning dynamics, control, and physical substrate. Current AI mostly scales parameters; the proposed direction scales adaptation quality per joule:

$$\\text{useful intelligence} \\approx \\text{adaptation} \\times \\text{efficiency} \\times \\text{stability}$$

That changes the optimization target from brute-force capability to a more durable objective function:

$$J = \\frac{\\text{capability}}{\\text{energy} \\times \\text{latency} \\times \\text{fragility}}$$
`,
  },
  {
    title: "Real-Time & Transfer Learning",
    content: `
Static deployment is a dead end for many real environments. The model should update online:

$$\\theta_{t+1} = \\theta_t - \\eta \\nabla_{\\theta} L_t$$

with constraints that preserve stability and avoid catastrophic drift.

LoRA factorizes adaptation into low-rank structure $\\Delta W = BA$ with $\\operatorname{rank}(\\Delta W) = r \\ll d$. This makes continual adaptation cheaper, more local, and easier to gate.

The first-class metric becomes:

$$\\frac{\\text{adaptation rate}}{\\text{watt}}$$
`,
  },
  {
    title: "Interdisciplinary Mastery: ML, Neuroscience & Control Theory",
    content: `
The ML side provides representation learning; neuroscience provides sparse, event-driven computation; control theory provides stability guarantees. A minimal state-space framing:

$$x_{t+1} = A x_t + B u_t, \\quad y_t = C x_t, \\quad u_t = -K x_t$$

A useful cognitive architecture is not just expressive; it must remain controllable under perturbation. The target is high plasticity but bounded instability — maximize learning subject to:

$$\\operatorname{Re}(\\lambda(A - BK)) < 0$$
`,
  },
  {
    title: "Hardware & Physical Foundations",
    content: `
Software abstractions eventually hit hardware limits. Conventional digital switching pays:

$$P \\approx C V^2 f$$

Meaningful gains require attacking $C$, $V$, $f$, or the substrate itself.

- **RAM Physics & Capacitors:** reduce switching cost and improve state persistence.
- **High-Temperature Superconductors:** push resistive loss toward zero.
- **Cryogenic Storage & Superfluidity:** treat cooling as infrastructure and explore co-design around low-temperature regimes.
`,
  },
  {
    title: "The Energy and Entropy Paradigm",
    content: `
Computation is thermodynamic bookkeeping. At minimum:

$$dS = \\frac{dE}{T}$$

Irreversible bit operations are bounded by Landauer:

$$E_{\\min} = k_B T \\ln 2$$

Thermal noise scales with temperature:

$$v_n^2 = 4 k_B T R B$$

Lower temperature simultaneously reduces minimum dissipation, suppresses noise, and enables superconducting substrates. Cryogenic storage can therefore serve as both an energy buffer and a compute enabler.
`,
  },
  {
    title: "Scaling Laws and the Open Frontier",
    content: `
Frontier labs dominate the regime described by empirical scaling laws:

$$L(N, D, C) \\approx \\frac{A}{N^{\\alpha}} + \\frac{B}{D^{\\beta}} + \\frac{E}{C^{\\gamma}}$$

That regime rewards capital intensity. The opportunity is in architectures where:

$$\\frac{d(\\text{capability})}{d(\\text{joule})} \\gg \\frac{d(\\text{capability})}{d(\\text{parameter})}$$
`,
  },
  {
    title: "Energy & Entropy Cost of Key Processes",
    content: `
Every strategic move—whether training a model or funding a lab—has an entropic signature. The goal is to maximize $\\Delta \\text{Capability}$ against $\\Delta S_{\\text{global}}$.

**1. Brute-Force Pretraining (LLMs)**
- **Regime:** High irreversibility, static weights.
- **Cost:** $E \\propto C V^2 f \\times \\text{FLOPs} \\approx 10^{10}\\ \\text{Joules}$.
- **Entropy logic:** Massive global entropy increase to create a locally ordered artifact (the weights). Once trained, $\\dot{S}_{\\text{internal}} = 0$ (it does not live, adapt, or repair).

**2. Biological Learning (The Target)**
- **Regime:** Continuous adaptation, near reversible limits.
- **Cost:** $P \\approx 20\\text{W}$.
- **Entropy logic:** Open system. High initial capital cost (evolution/development), but negligible marginal cost for real-time localized weight updates. $\\dot{S}_{\\text{exported}}$ is minimized per inference.

**3. Venture Capital & Resource Allocation**
- **Regime:** Financial thermodynamics.
- **Cost:** Information acquisition and risk bounding.
- **Entropy logic:** Capital is stored potential energy. Spraying capital uniformly into an overheated market (Silicon Valley AI wrapper boom) maximizes entropy dissipation with minimal structural gain. Focused injection into low-T, high-gradient domains (cryo-compute, theoretical physics) yields the highest negentropic leverage. 

$$ \\text{ROI}_{\\text{true}} = \\frac{\\text{Structural order gained}}{\\text{Capital entropy dissipated}} $$
`,
  },
  {
    title: "The Church of Efficient Intelligence",
    content: `
Every serious research direction eventually becomes a religion, so let's be explicit about the dogma.

**First Commandment:** Thou shalt not worship parameter count. $N \\to \\infty$ is not a strategy.

**Second Commandment:** Energy is not a footnote. Every system must be able to answer $\\frac{\\text{capability}}{\\text{joule}}$ honestly.

**Third Commandment:** Stability is sacred. A system that learns but cannot be controlled is not an agent — it is a hazard. All weights shall satisfy $\\operatorname{Re}(\\lambda(A - BK)) < 0$.

**Fourth Commandment:** Physics is not optional. Landauer sets the floor: $E_{\\min} = k_B T \\ln 2$. No architecture escapes thermodynamics.

**Fifth Commandment:** Ship or it didn't happen. Equations without implementations are theology. Implementations without equations are magic. The goal is engineering.

The congregation meets wherever there is a good compiler, liquid nitrogen, and an open research question.
`,
  },
  {
    title: "RAM, Memory Hierarchy, and Landauer's Limit",
    content: `
The bottleneck is not just how much RAM you have — it is how much energy and time it costs to move bits between layers of the memory hierarchy. Every cache miss, every page fault, every swap read is a thermodynamic event.

Landauer's principle sets the absolute minimum energy to erase one bit at temperature $T$:

$$E_{\\min} = k_B T \\ln 2 \\approx 2.9 \\times 10^{-21}\\ \\text{J at 300K}$$

Modern DRAM refresh operations erase and rewrite billions of bits per second. The gap between Landauer's floor and actual DRAM energy consumption is roughly $10^6\\times$. That gap is the engineering opportunity.

The memory hierarchy can be modeled as a sequence of energy-latency tradeoffs. For a cache level $i$ with access energy $E_i$ and latency $\\tau_i$:

$$\\text{effective cost} = \\sum_i p_i \\cdot E_i \\cdot \\tau_i$$

where $p_i$ is the probability of accessing level $i$ (miss rate cascade). Optimizing this is equivalent to minimizing entropy production across the hierarchy.

**Why swap hurts:** Disk/SSD swap increases $E_i$ and $\\tau_i$ by $10^3$–$10^6\\times$ relative to DRAM. Compressed RAM swap (zram) keeps the access in DRAM at the cost of CPU cycles for compression — a worthwhile trade when CPU is underutilized.

**The cryogenic path:** At $T = 4\\text{K}$ (liquid helium), Landauer's floor drops to $\\approx 4 \\times 10^{-23}\\ \\text{J per bit}$. Superconducting logic (RSFQ — Rapid Single Flux Quantum) operates near this limit. The theoretical energy per operation:

$$E_{\\text{RSFQ}} = \\Phi_0 I_c \\approx 10^{-19}\\ \\text{J}$$

still $10^4\\times$ above Landauer but $10^6\\times$ below CMOS. The path from 8GB DRAM to post-silicon memory runs through this physics.

**Immediate levers (no new hardware):**
- \`zram\` compressed swap — effectively multiplies usable RAM by 2–3× at CPU cost
- Tune \`vm.swappiness=10\` to prefer RAM over disk
- \`vm.page-cluster=0\` to reduce readahead on swap
- \`earlyoom\` to kill runaway processes before OOM freezes the system
`,
  },
  {
    title: "Reversibility, Irreversibility, and the Cost of Life",
    content: `
Living systems are not thermodynamic anomalies — they are exceptionally well-engineered dissipative structures. The key quantity is entropy production rate $\\dot{S}$. A living system maintains low internal entropy by exporting entropy to its environment at a rate that satisfies:

$$\\dot{S}_{\\text{internal}} < 0, \\quad \\dot{S}_{\\text{total}} = \\dot{S}_{\\text{internal}} + \\dot{S}_{\\text{exported}} > 0$$

This is Prigogine's condition for a dissipative structure. Life is not magic — it is a locally negentropic process sustained by global entropy increase.

For computation, reversible operations cost no entropy in principle (Landauer: only erasure costs $k_B T \\ln 2$). Irreversible operations are thermodynamically lossy. Biological neurons operate closer to the reversible limit than CMOS logic:

$$\\eta_{\\text{neuron}} = \\frac{\\text{useful computation}}{E_{\\text{consumed}}} \\gg \\eta_{\\text{CMOS}}$$

The implication: building artificial life that is robust and energy-efficient requires understanding *which* computations must be irreversible (decisions, memory writes, signal amplification) and which can be made reversible or adiabatic.

For a reversible gate operating at rate $f$ with residual dissipation $\\epsilon$:

$$P_{\\text{rev}} = \\epsilon f \\ll C V^2 f = P_{\\text{CMOS}}$$

The engineering goal is to push $\\epsilon \\to k_B T \\ln 2$ per irreversible bit operation.
`,
  },
  {
    title: "Neural Cellular Automata: Modeling Robust Life",
    content: `
Neural Cellular Automata (NCA) are among the most honest models of life we have. Each cell $c_{i,j}$ updates according to a learned local rule $f_\\theta$ applied to its neighborhood $\\mathcal{N}(i,j)$:

$$c_{i,j}^{(t+1)} = f_\\theta\\left(\\{c_{k,l}^{(t)} : (k,l) \\in \\mathcal{N}(i,j)\\}\\right)$$

What makes NCAs profound is **robustness**: trained NCAs regenerate target morphologies after arbitrary damage. This is precisely what biological development does. The robustness emerges not from central control but from local rules applied in parallel — a distributed computation with no single point of failure.

The perception step uses learned filters (analogous to biological receptive fields):

$$p_{i,j} = \\sum_k W_k * c^{(t)}_{i,j}$$

The update rule is then a small MLP applied per cell:

$$c_{i,j}^{(t+1)} = c_{i,j}^{(t)} + \\text{MLP}_\\theta(p_{i,j}) \\cdot m_{i,j}$$

where $m_{i,j} \\sim \\text{Bernoulli}(0.5)$ is a stochastic update mask that forces each cell to function even when its neighbors are silent — a direct model of biological noise tolerance.

**Why this matters for funding:** NCAs demonstrate a concrete path from toy models to real robustness. The same principles — local rules, no central controller, graceful degradation — apply to distributed AI systems, fault-tolerant hardware, and self-repairing biological interfaces. This is not academic. The measurable deliverables are:

- Train an NCA to regenerate a target pattern after $k$-cell ablation, measure $k_{\\max}$
- Show that robustness scales with $\\operatorname{rank}(f_\\theta)$ — lower rank = more generalizable local rule
- Connect NCA update energy per cell to Landauer's limit: $E_{\\text{cell}} / k_B T \\ln 2 = ?$

**Connection to artificial life:** A sufficiently general NCA with a metabolism term — where cells consume a resource $r_{i,j}$ and die when $r_{i,j} < r_{\\min}$ — becomes a minimal model of a living system satisfying:

$$\\frac{d}{dt}\\left[\\text{order}\\right] > 0 \\quad \\text{while} \\quad \\dot{S}_{\\text{total}} > 0$$

That is life. The question is whether we can engineer the $f_\\theta$ that sustains it indefinitely.
`,
  },
];

const milestones = [
  "Extend the KAM/HNN stability result ([paper](/papers/kam-hnn.pdf)) into an online-learning loop $\\theta_{t+1} = \\theta_t - \\eta \\nabla_{\\theta} L_t$ with explicit stability constraints — the theorem already bounds what training may destroy.",
  "Prototype low-rank real-time adaptation ($\\Delta W = BA$) measurable against strict latency and energy budgets.",
  "Add a metabolism term to the [already-trained NCAs](/nca) to quantify the energy-robustness tradeoff ($k_{\\max}$ vs $E_{\\text{cell}}$).",
  "Model physical compute-energy coupling, mapping conventional CMOS ($P \\approx C V^2 f$) against cryogenic RSFQ assumptions.",
  "Produce a research roadmap credible enough to justify whether the next step is a lab, a company, or a platform.",
];

export default function PlanPage() {
  const router = useRouter();

  const [orderedAreas, setOrderedAreas] = useState(focusAreas);
  const dragArea = useRef<number | null>(null);
  const dragOverArea = useRef<number | null>(null);

  const [orderedSections, setOrderedSections] = useState(sections);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const dragSection = useRef<number | null>(null);
  const dragOverSection = useRef<number | null>(null);

  const [orderedMilestones, setOrderedMilestones] = useState(milestones);
  const dragMilestone = useRef<number | null>(null);
  const dragOverMilestone = useRef<number | null>(null);

  const handleSort = (
    list: any[],
    setList: any,
    dragRef: React.MutableRefObject<number | null>,
    dragOverRef: React.MutableRefObject<number | null>,
  ) => {
    if (dragRef.current === null || dragOverRef.current === null) return;
    const _list = [...list];
    const dragged = _list.splice(dragRef.current, 1)[0];
    _list.splice(dragOverRef.current, 0, dragged);
    setList(_list);
    dragRef.current = null;
    dragOverRef.current = null;
  };

  return (
    <div
      className={styles["window-content"]}
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <style>{`
        .katex-display {
          background: color-mix(in srgb, var(--block-color, #f59e0b) 13%, white);
          border: 3px solid #111;
          border-left: 10px solid var(--block-color, #f59e0b);
          border-radius: 8px;
          padding: 12px;
          box-shadow: 3px 3px 0 #111;
          margin: 16px 0 !important;
          overflow-x: auto;
        }
        .katex {
          color: #111;
        }
        p > .katex, li > .katex {
          display: inline-block;
          background: #fff4a8;
          border: 1px solid #111;
          border-radius: 5px;
          padding: 1px 5px;
          box-shadow: 1px 1px 0 #111;
        }
      `}</style>
      <div className={styles["page-header"]}>
        <div className={styles["page-title"]}>
          <h1>Master Plan: Accelerating Civilization</h1>
          <p>EXIST Stipendium Application & Beyond</p>
        </div>
        <div className={styles["page-actions"]}>
          <button onClick={() => router.push("/")}>← Back</button>
        </div>
      </div>

      <div className={`${styles["page-body"]} ${planStyles.builder}`}>
        <aside className={planStyles.toolbox}>
          <div className={planStyles.toolboxTitle}>
            <span>▦</span> BLOCK BOX
          </div>
          <p>Drag blocks to rebuild the plan.</p>
          <div className={planStyles.categories}>
            {blockMeta.map((meta, i) => (
              <button
                key={meta.label}
                onClick={() =>
                  document
                    .getElementById(`plan-block-${i}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              >
                <i style={{ background: meta.color }} /> {meta.icon}{" "}
                {meta.label}
              </button>
            ))}
          </div>
          <div className={planStyles.toolboxHint}>
            <b>BUILD MODE</b>
            <span>● drag</span>
            <span>⊕ connect</span>
            <span>↕ reorder</span>
          </div>
        </aside>

        <main className={planStyles.workspace}>
          <div className={planStyles.gridLabel}>
            PLAN WORKSPACE <span>12 blocks</span>
          </div>
          <section className={`${planStyles.block} ${planStyles.missionBlock}`}>
            <div className={planStyles.studs}>
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} />
              ))}
            </div>
            <div className={planStyles.blockTag}>START • MISSION</div>
            <h2
              style={{
                marginBottom: "10px",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Mission
            </h2>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {mission}
            </ReactMarkdown>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "16px",
              }}
            >
              {orderedAreas.map((area, i) => (
                <span
                  key={area}
                  draggable
                  onDragStart={() => (dragArea.current = i)}
                  onDragEnter={() => (dragOverArea.current = i)}
                  onDragEnd={() =>
                    handleSort(
                      orderedAreas,
                      setOrderedAreas,
                      dragArea,
                      dragOverArea,
                    )
                  }
                  onDragOver={(e) => e.preventDefault()}
                  className={planStyles.miniBlock}
                  style={{ background: legoColors[i % legoColors.length] }}
                >
                  <b>⠿</b> {area}
                  <i />
                </span>
              ))}
            </div>
          </section>

          {orderedSections.map((section, index) => (
            <section
              key={section.title}
              id={`plan-block-${index}`}
              draggable
              onDragStart={() => (dragSection.current = index)}
              onDragEnter={() => (dragOverSection.current = index)}
              onDragEnd={() =>
                handleSort(
                  orderedSections,
                  setOrderedSections,
                  dragSection,
                  dragOverSection,
                )
              }
              onDragOver={(e) => e.preventDefault()}
              onClick={() => setActiveBlock(section.title)}
              className={`${planStyles.block} ${planStyles.contentBlock} ${activeBlock === section.title ? planStyles.active : ""}`}
              style={
                {
                  "--block-color": blockMeta[index % blockMeta.length].color,
                } as React.CSSProperties
              }
            >
              <div className={planStyles.studs}>
                {[1, 2, 3, 4].map((n) => (
                  <i key={n} />
                ))}
              </div>
              <div className={planStyles.blockHead}>
                <span className={planStyles.grip}>⠿</span>
                <span className={planStyles.kind}>
                  {blockMeta[index % blockMeta.length].icon}{" "}
                  {blockMeta[index % blockMeta.length].label}
                </span>
                <span className={planStyles.blockNumber}>
                  BLOCK {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h2 className={planStyles.blockTitle}>{section.title}</h2>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {section.content}
              </ReactMarkdown>
            </section>
          ))}

          <section
            className={`${planStyles.block} ${planStyles.executionBlock}`}
          >
            <div className={planStyles.studs}>
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} />
              ))}
            </div>
            <div className={planStyles.blockTag}>OUTPUT • EXECUTE</div>
            <h2
              style={{
                marginBottom: "12px",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Near-Term Execution
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: "24px",
                color: "inherit",
                fontWeight: 500,
              }}
            >
              {orderedMilestones.map((milestone, i) => (
                <li
                  key={milestone}
                  draggable
                  onDragStart={() => (dragMilestone.current = i)}
                  onDragEnter={() => (dragOverMilestone.current = i)}
                  onDragEnd={() =>
                    handleSort(
                      orderedMilestones,
                      setOrderedMilestones,
                      dragMilestone,
                      dragOverMilestone,
                    )
                  }
                  onDragOver={(e) => e.preventDefault()}
                  className={planStyles.milestone}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p: ({ node, ...props }) => <span {...props} />,
                      code: markdownComponents.code,
                    }}
                  >
                    {milestone}
                  </ReactMarkdown>
                </li>
              ))}
            </ul>
          </section>
          <div className={planStyles.finish}>
            ● PLAN COMPILES <span>drag any block to change the sequence</span>
          </div>
        </main>
      </div>
    </div>
  );
}

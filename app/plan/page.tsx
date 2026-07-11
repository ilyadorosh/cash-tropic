"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import planStyles from "./plan.module.scss";

type ViewMode = "story" | "build";
type ClaimKind =
  | "RUNNING"
  | "TESTABLE"
  | "ENGINEERING BET"
  | "OPEN QUESTION"
  | "PRINCIPLE";

type PlanSection = {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  kind: ClaimKind;
  summary: string;
  content: string;
};

const claimKinds: Array<{
  kind: ClaimKind;
  description: string;
  color: string;
}> = [
  {
    kind: "RUNNING",
    description: "You can open it, inspect it, or run it now.",
    color: "#22c55e",
  },
  {
    kind: "TESTABLE",
    description: "A claim with a metric and a way to be wrong.",
    color: "#3b82f6",
  },
  {
    kind: "ENGINEERING BET",
    description: "Plausible, useful, and not demonstrated yet.",
    color: "#f59e0b",
  },
  {
    kind: "OPEN QUESTION",
    description: "We do not know. That is the point of the experiment.",
    color: "#a855f7",
  },
  {
    kind: "PRINCIPLE",
    description: "A value or design constraint, not a scientific result.",
    color: "#ec4899",
  },
];

const focusAreas = [
  "adaptive learning",
  "stable dynamics",
  "energy-aware compute",
  "local rules",
  "shared worlds",
  "human agency",
];

const sections: PlanSection[] = [
  {
    id: "evidence",
    title: "Begin with receipts",
    category: "evidence",
    icon: "✓",
    color: "#22c55e",
    kind: "RUNNING",
    summary:
      "The vision earns attention only where a smaller version already works.",
    content: String.raw`
Three pieces exist today:

- **Stability theory for learned dynamics.** The [KAM/HNN paper](/papers/kam-hnn.pdf) treats a Hamiltonian Neural Network as a perturbed Hamiltonian system and asks which invariant structures survive. The [kicked-rotor demo](/kam) makes the geometry visible. This is a result about a defined class of systems—not a proof that arbitrary neural networks are safe.
- **A trained local-rule system.** The [Neural Cellular Automata lab](/nca) runs in the browser and regenerates learned forms after damage. Metabolism and physical energy measurement are proposed experiments, not shipped results.
- **A playable integration laboratory.** [Action in Love](/) combines generated social pages, persistent state, model-driven characters, browser physics, and explorable simulations. It is evidence that the pieces can meet in one world; it is not a claim of AGI.

$$\text{credibility} = \text{working artifact} + \text{stated limits} + \text{reproduction path}$$

If a visitor cannot distinguish the demo from the dream, the communication has failed.
`,
  },
  {
    id: "thesis",
    title: "The thesis—and its burden of proof",
    category: "thesis",
    icon: "◆",
    color: "#f59e0b",
    kind: "TESTABLE",
    summary: "Useful intelligence is a system property, not a parameter count.",
    content: String.raw`
The working hypothesis is that many real environments need **adaptation, efficiency, and recoverable stability** more than another static increase in scale. A practical scorecard is:

$$J = \frac{C \cdot A}{E \cdot \tau \cdot (1 + F)}$$

where $C$ is task capability, $A$ is adaptation quality, $E$ is measured or estimated energy, $\tau$ is response/update latency, and $F$ is a fragility penalty: forgetting, divergence, or failure to recover after perturbation.

This is **not a law of physics** and the units do not magically cancel. It is a decision tool. Every experiment must publish the components separately so a flattering composite score cannot hide a regression.

The thesis loses if constrained local adaptation produces no useful Pareto improvement over a static model plus retrieval—or if its stability and measurement overhead erase the gain. That would be a valuable result.
`,
  },
  {
    id: "learning-loop",
    title: "Build a learning loop, not a mutable mystery",
    category: "learning",
    icon: "↻",
    color: "#3b82f6",
    kind: "ENGINEERING BET",
    summary: "Adapt locally, measure continuously, and preserve a route back.",
    content: String.raw`
A safe online learner needs more structure than gradient descent. One candidate loop is:

$$\theta_{t+1} = \Pi_{\mathcal S}\left(\theta_t - \eta P_t \nabla_{\theta}L_t\right)$$

$P_t$ restricts the update to a small, inspectable subspace; $\Pi_{\mathcal S}$ projects or rejects changes that leave a defined stability set. Low-rank adaptation supplies one such subspace:

$$\Delta W = BA, \qquad \operatorname{rank}(\Delta W)=r \ll d$$

The first benchmark compares four honest baselines on the same task stream: frozen model, frozen model plus retrieval, full update, and gated low-rank update. Measure time-to-adapt, joules or a disclosed energy proxy, retained performance, rollback rate, and recovery after distribution shift.

“Real-time learning” only counts when the system learns something useful before the environment changes again.
`,
  },
  {
    id: "stability",
    title: "Stability before swagger",
    category: "control",
    icon: "⌁",
    color: "#8b5cf6",
    kind: "TESTABLE",
    summary:
      "A learner that cannot fail legibly is not ready to steer anything important.",
    content: String.raw`
Control theory offers a disciplined vocabulary when—and only when—the state, input, output, and disturbance can be defined:

$$x_{t+1}=Ax_t+Bu_t+w_t, \qquad y_t=Cx_t, \qquad u_t=-Kx_t$$

For this discrete-time linearized regime, $\rho(A-BK)<1$ is a meaningful local condition. It is not a universal safety certificate for a language model. The research task is to find narrower settings where Lyapunov functions, energy drift, spectral bounds, runtime monitors, or reversible checkpoints give useful guarantees.

Each adaptive experiment therefore needs: a safe baseline, a bounded update region, a tripwire, a rollback state, and an account of what the monitor cannot see. Performance without recoverability is an incomplete result.
`,
  },
  {
    id: "energy",
    title: "Energy belongs inside the algorithm",
    category: "physics",
    icon: "⚡",
    color: "#06b6d4",
    kind: "ENGINEERING BET",
    summary:
      "A computation includes memory movement, heat, cooling, and the machine around it.",
    content: String.raw`
Logical irreversibility has a thermodynamic floor:

$$E_{\mathrm{erase}} \geq k_B T \ln 2$$

Conventional switching is often approximated by $P_{\mathrm{switch}} \approx \alpha C V^2 f$. These equations orient the search; they do not predict a modern computer's wall-plug energy by themselves.

- Landauer bounds logically irreversible erasure, not every operation.
- Lower temperature lowers that bound, but refrigeration has a system-level cost.
- Superconducting or cryogenic logic wins only if the full stack—including cooling and I/O—wins.
- Memory movement can dominate arithmetic, but the ratio depends on workload and hardware.

The first useful artifact is therefore mundane and powerful: a reproducible harness that records latency, device power or a named proxy, memory traffic, temperature assumptions, and useful work. Cryogenic compute remains an open hardware path, not a shortcut in the spreadsheet.
`,
  },
  {
    id: "local-life",
    title: "Local rules can make resilient worlds",
    category: "life",
    icon: "✣",
    color: "#84cc16",
    kind: "OPEN QUESTION",
    summary:
      "Can a system repair itself while paying an explicit cost for staying alive?",
    content: String.raw`
An NCA cell updates from local information rather than a central blueprint:

$$c_{i,j}^{(t+1)}=c_{i,j}^{(t)}+f_{\theta}(\mathcal N(c^{(t)}_{i,j}))\,m_{i,j}$$

The running demo shows regeneration. The next experiment adds a resource channel $r_{i,j}$, charges updates, and removes cells that cannot meet a maintenance threshold. Sweep damage size and resource supply, then report recovery probability, time, update count, and a clearly labeled energy proxy.

The interesting question is not whether this is literally alive. It is whether decentralized learned rules can deliver repair, graceful degradation, and legible local behavior more efficiently than centralized control. The playful interface matters here: people should be able to poke the organism, damage it, feed it, and understand the result with their hands.
`,
  },
  {
    id: "strategy",
    title: "Listen to the giants; do not borrow their certainty",
    category: "strategy",
    icon: "↗",
    color: "#f97316",
    kind: "PRINCIPLE",
    summary: "Advice from powerful builders is input data, not destiny.",
    content: String.raw`
[Paul Graham argues](https://paulgraham.com/hubs.html) that hubs concentrate people, capital, and norms that amplify ambition. [Jensen Huang's older execution advice](https://ecorner.stanford.edu/wp-content/uploads/sites/2/2003/01/1125.pdf) pairs a long horizon with deliberately narrow projects. [Sam Altman's “steamroll” warning](https://www.thetwentyminutevc.com/sam-altman-brad-lightcap) is best read as a constraint: do not build a thin layer whose only advantage is a temporary model limitation.

All three can be useful without becoming commandments. Networks matter; so do independent thought, places outside the dominant hub, and problems that a frontier lab's roadmap will not automatically absorb. Scale is real. So are embodiment, trust, energy, local context, and the long tail of human purposes.

An inspired mission post should make a talented person feel that their presence changes the outcome. It should not pretend the founder invented the ingredients or that victory is guaranteed.

$$\text{strategy}=\text{trajectory awareness}\times\text{independent thesis}\times\text{proof}$$
`,
  },
  {
    id: "shared-machine",
    title: "We are one machine, with many authors",
    category: "community",
    icon: "♡",
    color: "#ec4899",
    kind: "PRINCIPLE",
    summary:
      "Ambition becomes trustworthy when contribution and correction stay visible.",
    content: String.raw`
There is no lone-genius version of this work. KAM carries Kolmogorov, Arnold, Moser, Hamilton, and generations of mathematicians. Neural cellular automata inherit cellular automata, developmental biology, differentiable programming, and open research code. The product inherits browsers, databases, model builders, chip designers, maintainers, critics, friends, and the people who contributed care when the work was still hard to explain.

Machines contribute search, synthesis, drafts, and labor. Humans contribute labor too—and judgment, consent, responsibility, lived stakes, and the right to say no. Neither contribution should be erased.

So the operating agreement is simple:

- name sources and contributors;
- separate evidence, hypothesis, metaphor, and marketing;
- publish useful negative results;
- invite criticism before certainty hardens into identity;
- increase human agency without hiding physical or social costs.

“Act in love” is not a claim that good intentions make a system good. It is a demand to keep asking who gains agency, who pays, who is missing, and whether we can still enjoy building it together.
`,
  },
  {
    id: "falsifiers",
    title: "What would change our minds?",
    category: "falsifiers",
    icon: "?",
    color: "#a855f7",
    kind: "OPEN QUESTION",
    summary:
      "A plan that cannot lose an argument is a brand, not a research program.",
    content: String.raw`
We should narrow, redirect, or stop a branch when:

- local adaptation fails to beat a frozen-plus-retrieval baseline under the same budget;
- stability gates cost more capability than they protect, with no safer niche found;
- an apparent cryogenic advantage disappears after cooling, I/O, and utilization are counted;
- NCA “metabolism” produces pretty motion but no measurable resilience insight;
- independent users cannot reproduce the result or understand the interface;
- the work reduces people's agency, even while improving a technical metric.

Failure is not the opposite of the plan. Hidden failure is. The public artifact should keep a changelog of what survived contact with evidence.
`,
  },
];

const milestones = [
  {
    horizon: "NOW",
    title: "Publish the measurement harness",
    measure:
      "One task stream; four baselines; latency, energy proxy, forgetting, and rollback reported together.",
  },
  {
    horizon: "NEXT",
    title: "Give the NCA a metabolism",
    measure:
      "Interactive resource channel plus damage sweeps with recovery curves—not only a beautiful animation.",
  },
  {
    horizon: "THEN",
    title: "Gate a low-rank online learner",
    measure:
      "A bounded update, monitor, tripwire, and reversible checkpoint running in one demonstrator.",
  },
  {
    horizon: "OPEN",
    title: "Extend the stability result",
    measure:
      "A precise theorem or a precise counterexample connecting learned updates to invariant-structure loss.",
  },
  {
    horizon: "ALWAYS",
    title: "Keep a public field notebook",
    measure:
      "Sources, contributors, costs, failures, and changed beliefs remain visible beside the demos.",
  },
];

const sources = [
  { label: "KAM theory meets HNNs", href: "/papers/kam-hnn.pdf" },
  {
    label: "Growing Neural Cellular Automata",
    href: "https://distill.pub/2020/growing-ca/",
  },
  {
    label: "Hamiltonian Neural Networks",
    href: "https://proceedings.neurips.cc/paper/2019/hash/26cd8ecadce0d4efd6cc8a8725cbd1f8-Abstract.html",
  },
  { label: "LoRA", href: "https://arxiv.org/abs/2106.09685" },
  { label: "Landauer's principle", href: "https://doi.org/10.1147/rd.53.0183" },
  { label: "Why Startup Hubs Work", href: "https://paulgraham.com/hubs.html" },
  {
    label: "The Importance of Execution",
    href: "https://ecorner.stanford.edu/wp-content/uploads/sites/2/2003/01/1125.pdf",
  },
  {
    label: "The steamroller question",
    href: "https://www.thetwentyminutevc.com/sam-altman-brad-lightcap",
  },
];

const markdownComponents = {
  p: ({
    node: _node,
    ...props
  }: React.HTMLAttributes<HTMLParagraphElement> & { node?: unknown }) => (
    <p {...props} />
  ),
  ul: ({
    ordered: _ordered,
    node: _node,
    ...props
  }: React.HTMLAttributes<HTMLUListElement> & {
    ordered?: boolean;
    node?: unknown;
  }) => <ul {...props} />,
  li: ({
    ordered: _ordered,
    index: _index,
    node: _node,
    ...props
  }: React.HTMLAttributes<HTMLLIElement> & {
    ordered?: boolean;
    index?: number;
    node?: unknown;
  }) => <li {...props} />,
  code: ({
    inline: _inline,
    node: _node,
    ...props
  }: React.HTMLAttributes<HTMLElement> & {
    inline?: boolean;
    node?: unknown;
  }) => <code {...props} />,
  a: ({
    node: _node,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) => {
    const external = href?.startsWith("http");
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        {...props}
      />
    );
  },
};

const issueUrl =
  "https://github.com/ilyadorosh/cash-tropic/issues/new?title=I%20want%20to%20help%20with%20the%20plan&body=The%20block%20I%20care%20about%3A%0A%0AWhat%20I%20can%20contribute%3A%0A%0AWhat%20I%20think%20the%20plan%20gets%20wrong%3A";

const missionFormula = String.raw`$$J = \frac{\text{capability}\times\text{adaptation}}{\text{energy}\times\text{latency}\times\text{fragility}}$$`;

export default function PlanPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("story");
  const [orderedSections, setOrderedSections] = useState(sections);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [shareState, setShareState] = useState("Share this plan");
  const dragSection = useRef<number | null>(null);
  const dragOverSection = useRef<number | null>(null);

  const reorderSections = () => {
    if (dragSection.current === null || dragOverSection.current === null)
      return;
    const next = [...orderedSections];
    const [dragged] = next.splice(dragSection.current, 1);
    next.splice(dragOverSection.current, 0, dragged);
    setOrderedSections(next);
    dragSection.current = null;
    dragOverSection.current = null;
  };

  const resetOrder = () => {
    setOrderedSections(sections);
    setActiveBlock(null);
  };

  const sharePlan = async () => {
    const url = `${window.location.origin}/plan`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Action in Love — an open research plan",
          text: "A buildable plan for adaptive, stable, energy-aware intelligence—and an invitation to challenge it.",
          url,
        });
        setShareState("Shared ♡");
      } else {
        await navigator.clipboard.writeText(url);
        setShareState("Link copied ♡");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareState("Could not copy—use the address bar");
    }
  };

  const copySectionLink = async (id: string) => {
    const url = `${window.location.origin}/plan#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareState("Section link copied ♡");
    } catch {
      window.location.hash = id;
      setShareState("Section selected—copy the address bar");
    }
  };

  return (
    <div className={planStyles.page}>
      <header className={planStyles.topbar}>
        <button
          className={planStyles.brand}
          onClick={() => router.push("/")}
          aria-label="Back to Action in Love"
        >
          <span className={planStyles.heartMark}>▶</span>
          <span>
            <b>actinlove</b>
            <small>OPEN RESEARCH PLAN</small>
          </span>
        </button>
        <div className={planStyles.viewSwitch} aria-label="Plan view">
          <button
            className={viewMode === "story" ? planStyles.selected : ""}
            onClick={() => setViewMode("story")}
            aria-pressed={viewMode === "story"}
          >
            Read
          </button>
          <button
            className={viewMode === "build" ? planStyles.selected : ""}
            onClick={() => setViewMode("build")}
            aria-pressed={viewMode === "build"}
          >
            Build
          </button>
        </div>
        <button className={planStyles.shareButton} onClick={sharePlan}>
          ↗ {shareState}
        </button>
      </header>

      <div
        className={`${planStyles.builder} ${viewMode === "story" ? planStyles.storyMode : ""}`}
      >
        <aside className={planStyles.toolbox} aria-label="Plan blocks">
          <div className={planStyles.toolboxTitle}>
            <span>▦</span> BLOCK BOX
          </div>
          <p>
            The argument is modular. Drag it, challenge it, replace a weak
            block.
          </p>
          <nav className={planStyles.categories}>
            {orderedSections.map((section) => (
              <button
                key={section.id}
                onClick={() =>
                  document
                    .getElementById(section.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              >
                <i style={{ background: section.color }} /> {section.icon}{" "}
                {section.category}
              </button>
            ))}
          </nav>
          <div className={planStyles.toolboxHint}>
            <b>BUILD MODE</b>
            <span>⠿ drag to reorder</span>
            <span># copy one block</span>
            <button onClick={resetOrder}>↺ reset sequence</button>
          </div>
        </aside>

        <main className={planStyles.workspace}>
          <section className={planStyles.hero}>
            <div className={planStyles.heroGlow} />
            <div className={planStyles.heroCopy}>
              <div className={planStyles.eyebrow}>
                LOVE IN ACTION · ENERGY IN FLOW · VERSION 0.2
              </div>
              <h1>
                Build intelligence that learns{" "}
                <em>without burning the world around it.</em>
              </h1>
              <p>
                Action in Love is an open research playground for adaptive
                learning, stable dynamics, local repair, and the physical cost
                of computation. Not a prophecy. A set of buildable questions—and
                an invitation.
              </p>
              <div className={planStyles.heroActions}>
                <button
                  onClick={() =>
                    document
                      .getElementById("evidence")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  See what runs ↓
                </button>
                <button
                  className={planStyles.secondaryAction}
                  onClick={sharePlan}
                >
                  Share the question ↗
                </button>
              </div>
            </div>
            <div
              className={planStyles.coreMachine}
              aria-label="The plan's core loop"
            >
              <div className={planStyles.machineTop}>ACTINLOVE / CORE</div>
              <div className={planStyles.coreHeart}>▶</div>
              <div className={planStyles.machineEquation}>
                perceive → remember → model → decide → act
              </div>
              <div className={planStyles.machinePorts}>
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className={planStyles.heroFoot}>
              <span>
                <b>3</b> running artifacts
              </span>
              <span>
                <b>9</b> claim blocks
              </span>
              <span>
                <b>∞</b> room to contribute
              </span>
            </div>
          </section>

          <section className={planStyles.preamble}>
            <div>
              <span>THE SHORT VERSION</span>
              <h2>Capability is not enough.</h2>
            </div>
            <div className={planStyles.preambleFormula}>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {missionFormula}
              </ReactMarkdown>
            </div>
            <p>
              That expression is a scorecard, not a natural law. The research
              program is to define every term honestly, build smaller systems
              where the trade-offs are measurable, and publish what fails.
            </p>
            <div className={planStyles.focusRow}>
              {focusAreas.map((area, index) => (
                <span
                  key={area}
                  style={
                    {
                      "--chip": sections[index % sections.length].color,
                    } as React.CSSProperties
                  }
                >
                  {area}
                </span>
              ))}
            </div>
          </section>

          <section className={planStyles.legend} aria-labelledby="claims-title">
            <div className={planStyles.legendIntro}>
              <span>TRUST LAYER</span>
              <h2 id="claims-title">
                Know what kind of claim you are reading.
              </h2>
              <p>Color is epistemology, not decoration.</p>
            </div>
            <div className={planStyles.legendGrid}>
              {claimKinds.map((item) => (
                <div key={item.kind}>
                  <i style={{ background: item.color }} />
                  <b>{item.kind}</b>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <div className={planStyles.gridLabel}>
            THE ARGUMENT{" "}
            <span>
              {viewMode === "build"
                ? "drag blocks to change the sequence"
                : "about 7 minutes"}
            </span>
          </div>

          {orderedSections.map((section, index) => (
            <article
              key={section.id}
              id={section.id}
              draggable={viewMode === "build"}
              onDragStart={() => {
                if (viewMode === "build") dragSection.current = index;
              }}
              onDragEnter={() => {
                if (viewMode === "build") dragOverSection.current = index;
              }}
              onDragEnd={reorderSections}
              onDragOver={(event) => {
                if (viewMode === "build") event.preventDefault();
              }}
              onClick={() => viewMode === "build" && setActiveBlock(section.id)}
              className={`${planStyles.block} ${activeBlock === section.id ? planStyles.active : ""}`}
              style={{ "--block-color": section.color } as React.CSSProperties}
            >
              <div className={planStyles.studs}>
                {[1, 2, 3, 4].map((n) => (
                  <i key={n} />
                ))}
              </div>
              <div className={planStyles.blockHead}>
                <span className={planStyles.grip} aria-hidden="true">
                  ⠿
                </span>
                <span className={planStyles.kind}>
                  {section.icon} {section.kind}
                </span>
                <span className={planStyles.blockNumber}>
                  BLOCK {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  className={planStyles.anchorButton}
                  onClick={(event) => {
                    event.stopPropagation();
                    copySectionLink(section.id);
                  }}
                  aria-label={`Copy link to ${section.title}`}
                >
                  #
                </button>
              </div>
              <p className={planStyles.blockSummary}>{section.summary}</p>
              <h2>{section.title}</h2>
              <div className={planStyles.markdown}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            </article>
          ))}

          <section className={planStyles.roadmap} id="roadmap">
            <div className={planStyles.roadmapHead}>
              <span>OUTPUT / EXECUTE</span>
              <h2>Five commitments that make the vision expensive to fake.</h2>
            </div>
            <div className={planStyles.milestones}>
              {milestones.map((milestone, index) => (
                <article key={milestone.title}>
                  <span>{milestone.horizon}</span>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.measure}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={planStyles.lineage} id="lineage">
            <div>
              <span>LINEAGE / SOURCES</span>
              <h2>Nothing here arrived alone.</h2>
              <p>
                These are starting points, not decorative citations. Follow
                them, challenge the interpretation, and add what is missing.
              </p>
            </div>
            <nav>
              {sources.map((source, index) => (
                <a
                  key={source.label}
                  href={source.href}
                  target={source.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {source.label}
                  <b>↗</b>
                </a>
              ))}
            </nav>
          </section>

          <section className={planStyles.invitation} id="join">
            <div className={planStyles.invitationHeart}>♡</div>
            <div>
              <span>THIS IS THE OPEN PORT</span>
              <h2>Take a block. Improve it. Bring it back.</h2>
              <p>
                You do not have to believe the whole plan. Reproduce one result,
                falsify one assumption, make one demo legible, or explain one
                missing cost. The goal is not agreement; it is shared contact
                with reality.
              </p>
            </div>
            <div className={planStyles.invitationActions}>
              <a href={issueUrl} target="_blank" rel="noreferrer">
                I want to contribute ↗
              </a>
              <a
                href="https://github.com/ilyadorosh/cash-tropic"
                target="_blank"
                rel="noreferrer"
              >
                Inspect the code ↗
              </a>
              <button onClick={sharePlan}>Invite someone ♡</button>
              <button onClick={() => window.print()}>Save / print</button>
            </div>
          </section>

          <footer className={planStyles.footer}>
            <span>● OPEN PLAN · EXPECT IT TO CHANGE</span>
            <p>
              Built with equations, code, criticism, care, and a
              still-functioning sense of play.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to top ↑
            </button>
          </footer>
        </main>
      </div>
      <div className={planStyles.toast} role="status" aria-live="polite">
        {shareState}
      </div>
    </div>
  );
}

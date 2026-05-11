"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./dashboard.module.scss";
import { DEFAULT_MODELS, ServiceProvider } from "../constant";

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface NavItem {
  href: string;
  icon: string;
  title: string;
  description: string;
  status?: "live" | "beta" | "wip";
}

interface ModelInfo {
  name: string;
  provider: string;
  providerType: string;
  available: boolean;
}

// Project progress milestones
const projectMilestones = [
  { id: 1, title: "Core Chat Infrastructure", progress: 100, status: "done" },
  { id: 2, title: "Multi-Provider Support", progress: 100, status: "done" },
  { id: 3, title: "ActInLove Integration", progress: 85, status: "active" },
  { id: 4, title: "Dashboard Meta-View", progress: 60, status: "active" },
  { id: 5, title: "Model Hot-Switching", progress: 40, status: "wip" },
  { id: 6, title: "Usage Analytics", progress: 20, status: "planned" },
  { id: 7, title: "Community Contributions", progress: 10, status: "planned" },
];

// AI Stack Layers - from silicon to users
const aiStackLayers = [
  {
    id: "users",
    name: "👥 Users & Communities",
    description: "Meme substrate carriers, agentic application drivers",
    color: "#00ff88",
    companies: ["You", "Communities", "Creators"],
    position: "top",
    isUs: true,
  },
  {
    id: "apps",
    name: "🚀 Agentic Applications",
    description: "Cash Tropic, ActInLove, AI interfaces",
    color: "#00d9ff",
    companies: ["Cash Tropic", "ChatGPT", "Claude", "Copilot"],
    position: "high",
    isUs: true,
  },
  {
    id: "models",
    name: "🧠 Foundation Models",
    description: "LLMs, multimodal, reasoning engines",
    color: "#d4a574",
    companies: ["OpenAI", "Anthropic", "Google", "Meta"],
    position: "mid-high",
  },
  {
    id: "infra",
    name: "☁️ Cloud & Inference",
    description: "Serving infrastructure, optimization",
    color: "#4285f4",
    companies: ["AWS", "Azure", "Groq", "Sambanova"],
    position: "mid",
  },
  {
    id: "chips",
    name: "⚡ AI Chips & GPUs",
    description: "Training and inference hardware",
    color: "#76b900",
    companies: ["NVIDIA", "AMD", "Intel", "Cerebras"],
    position: "low",
  },
  {
    id: "fabs",
    name: "🏭 Chip Fabrication",
    description: "Semiconductor manufacturing",
    color: "#ff6b35",
    companies: ["TSMC", "Samsung", "Intel Foundry"],
    position: "base",
  },
  {
    id: "equipment",
    name: "🔬 Fab Equipment",
    description: "Lithography, etching, deposition",
    color: "#9333ea",
    companies: ["ASML", "Applied Materials", "Lam Research", "KLA"],
    position: "foundation",
  },
];

// Key insights / situational awareness
const situationalInsights = [
  {
    title: "Compute is Growing 4x/year",
    description:
      "AI training compute doubles every 6 months. We're in the steep part of the S-curve.",
    icon: "📈",
    source: "Epoch AI",
  },
  {
    title: "Energy is the Bottleneck",
    description:
      "Data centers need gigawatts. Nuclear renaissance incoming. Control energy = control AI.",
    icon: "⚡",
    source: "IEA Reports",
  },
  {
    title: "Agentic is Next",
    description:
      "From chat to agents. Autonomous systems that take actions. We build the interfaces.",
    icon: "🤖",
    source: "Industry Consensus",
  },
  {
    title: "Open Source Accelerating",
    description:
      "Llama, Mistral, Qwen closing the gap. Commoditization at the model layer = opportunity at app layer.",
    icon: "🔓",
    source: "HuggingFace",
  },
];

const navItems: NavItem[] = [
  {
    href: "/",
    icon: "🤖",
    title: "Chat",
    description: "AI conversations with any model",
    status: "live",
  },
  {
    href: "/#/love",
    icon: "💕",
    title: "ActInLove",
    description: "36 questions to fall in love",
    status: "beta",
  },
  {
    href: "/clipboard",
    icon: "📋",
    title: "Clipboard",
    description: "Manage text snippets & history",
    status: "live",
  },
  {
    href: "/game",
    icon: "🎮",
    title: "Game Engine",
    description: "3D exploration & play",
    status: "beta",
  },
  {
    href: "/conversations",
    icon: "💬",
    title: "Conversations",
    description: "Chat history & threads",
    status: "live",
  },
  {
    href: "/editor",
    icon: "✏️",
    title: "Editor",
    description: "Write & format content",
    status: "live",
  },
  {
    href: "/matrix",
    icon: "🔮",
    title: "Matrix",
    description: "Data visualization",
    status: "wip",
  },
  {
    href: "/4d",
    icon: "🌀",
    title: "4D Platform",
    description: "Multi-dimensional view",
    status: "beta",
  },
  {
    href: "/admin/profiles",
    icon: "👤",
    title: "Profiles",
    description: "Manage user profiles",
    status: "live",
  },
];

// Group models by provider
const groupModelsByProvider = (models: typeof DEFAULT_MODELS) => {
  const groups: Record<string, ModelInfo[]> = {};
  models.forEach((model) => {
    const providerName = model.provider.providerName;
    if (!groups[providerName]) {
      groups[providerName] = [];
    }
    groups[providerName].push({
      name: model.name,
      provider: model.provider.providerName,
      providerType: model.provider.providerType,
      available: model.available,
    });
  });
  return groups;
};

const providerIcons: Record<string, string> = {
  Groq: "⚡",
  Sambanova: "🚀",
  Anthropic: "🧠",
  OpenAI: "💚",
  Google: "🔮",
  Azure: "☁️",
  Baidu: "🐼",
  ByteDance: "🎵",
  Alibaba: "🛒",
};

const providerColors: Record<string, string> = {
  Groq: "#ff6b35",
  Sambanova: "#00d4aa",
  Anthropic: "#d4a574",
  OpenAI: "#10a37f",
  Google: "#4285f4",
  Azure: "#0078d4",
};

export default function DashboardPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [visionImages, setVisionImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const modelGroups = useMemo(() => groupModelsByProvider(DEFAULT_MODELS), []);

  const totalModels = DEFAULT_MODELS.length;
  const availableModels = DEFAULT_MODELS.filter((m) => m.available).length;

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTodo }),
      });
      if (res.ok) {
        const todo = await res.json();
        setTodos([todo, ...todos]);
        setNewTodo("");
      }
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (res.ok) {
        setTodos(
          todos.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTodos(todos.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    // Store in localStorage for persistence
    localStorage.setItem("dashboard-selected-model", modelName);
  };

  const overallProgress = Math.round(
    projectMilestones.reduce((acc, m) => acc + m.progress, 0) /
      projectMilestones.length,
  );

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>🌊 Cash Tropic</h1>
        <p className={styles.subtitle}>
          Project Meta-Dashboard • Building the future of AI interaction
        </p>
        <div className={styles.progressOverview}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {overallProgress}% Complete
          </span>
        </div>
      </header>

      <div className={styles.content}>
        {/* Project Stats */}
        <section className={styles.statsSection}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🤖</span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{availableModels}</span>
              <span className={styles.statLabel}>Models Available</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🏢</span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {Object.keys(modelGroups).length}
              </span>
              <span className={styles.statLabel}>AI Providers</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🎯</span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {projectMilestones.filter((m) => m.status === "done").length}/
                {projectMilestones.length}
              </span>
              <span className={styles.statLabel}>Milestones Done</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📦</span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {navItems.filter((n) => n.status === "live").length}
              </span>
              <span className={styles.statLabel}>Live Features</span>
            </div>
          </div>
        </section>

        {/* Model Switcher - The Key Innovation */}
        <section className={styles.modelSection}>
          <h2>⚡ Quick Model Switch</h2>
          <p className={styles.sectionDesc}>
            One-click model switching. No more digging through menus.
          </p>
          <div className={styles.modelProviders}>
            {Object.entries(modelGroups).map(([provider, models]) => (
              <div key={provider} className={styles.providerGroup}>
                <button
                  className={`${styles.providerHeader} ${expandedProvider === provider ? styles.expanded : ""}`}
                  onClick={() =>
                    setExpandedProvider(
                      expandedProvider === provider ? null : provider,
                    )
                  }
                  style={{ borderColor: providerColors[provider] || "#666" }}
                >
                  <span className={styles.providerIcon}>
                    {providerIcons[provider] || "🔧"}
                  </span>
                  <span className={styles.providerName}>{provider}</span>
                  <span className={styles.modelCount}>{models.length}</span>
                  <span className={styles.expandIcon}>
                    {expandedProvider === provider ? "▼" : "▶"}
                  </span>
                </button>
                {expandedProvider === provider && (
                  <div className={styles.modelList}>
                    {models.map((model) => (
                      <button
                        key={model.name}
                        className={`${styles.modelButton} ${selectedModel === model.name ? styles.selected : ""}`}
                        onClick={() => handleModelSelect(model.name)}
                      >
                        <span className={styles.modelName}>{model.name}</span>
                        {selectedModel === model.name && (
                          <span className={styles.activeIndicator}>●</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedModel && (
            <div className={styles.selectedModelBanner}>
              <span>Active: </span>
              <strong>{selectedModel}</strong>
              <Link href="/" className={styles.chatLink}>
                Start Chatting →
              </Link>
            </div>
          )}
        </section>

        {/* Project Milestones */}
        <section className={styles.milestonesSection}>
          <h2>🎯 Project Roadmap</h2>
          <div className={styles.milestonesList}>
            {projectMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`${styles.milestone} ${styles[milestone.status]}`}
              >
                <div className={styles.milestoneHeader}>
                  <span className={styles.milestoneTitle}>
                    {milestone.title}
                  </span>
                  <span className={styles.milestoneStatus}>
                    {milestone.status === "done" && "✅"}
                    {milestone.status === "active" && "🔄"}
                    {milestone.status === "wip" && "🚧"}
                    {milestone.status === "planned" && "📋"}
                  </span>
                </div>
                <div className={styles.milestoneProgress}>
                  <div
                    className={styles.milestoneBar}
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
                <span className={styles.milestonePercent}>
                  {milestone.progress}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation Grid */}
        <section className={styles.navSection}>
          <h2>🚀 Features</h2>
          <div className={styles.navGrid}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navCard}>
                <span className={styles.navIcon}>{item.icon}</span>
                <div className={styles.navInfo}>
                  <h3>
                    {item.title}
                    {item.status && (
                      <span
                        className={`${styles.statusBadge} ${styles[item.status]}`}
                      >
                        {item.status}
                      </span>
                    )}
                  </h3>
                  <p>{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Todo List */}
        <section className={styles.todoSection}>
          <h2>📝 Development Tasks</h2>
          <form onSubmit={addTodo} className={styles.todoForm}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a task to accelerate growth..."
              className={styles.todoInput}
            />
            <button type="submit" className={styles.addButton}>
              Add
            </button>
          </form>

          <div className={styles.todoList}>
            {isLoading ? (
              <p className={styles.loading}>Loading tasks...</p>
            ) : todos.length === 0 ? (
              <p className={styles.empty}>No tasks yet. Add one above!</p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`${styles.todoItem} ${todo.completed ? styles.completed : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.todoTitle}>{todo.title}</span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className={styles.deleteButton}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Vision Statement */}
        <section className={styles.visionSection}>
          <h2>🌟 The Vision</h2>
          <div className={styles.visionContent}>
            <p>
              <strong>Make AI switching as easy as changing tabs.</strong> No
              more vendor lock-in. No more complex configurations. Just pick a
              model and go.
            </p>
            <p>
              Contributing to how AI is used—one interface to rule them all. git
              hope. let&apos;s go.
            </p>
          </div>
        </section>

        {/* AI Future Situational Awareness */}
        <section className={styles.aiStackSection}>
          <h2>🔮 AI Stack Situational Awareness</h2>
          <p className={styles.sectionDesc}>
            Where we are in the stack. Autocatalytic growth from silicon to
            users.
          </p>

          <div className={styles.stackVisualization}>
            {aiStackLayers.map((layer, index) => (
              <div
                key={layer.id}
                className={`${styles.stackLayer} ${layer.isUs ? styles.ourLayer : ""}`}
                style={{
                  borderColor: layer.color,
                  animationDelay: `${index * 0.1}s`,
                }}
                onClick={() =>
                  setExpandedLayer(expandedLayer === layer.id ? null : layer.id)
                }
              >
                <div className={styles.layerHeader}>
                  <span className={styles.layerName}>{layer.name}</span>
                  {layer.isUs && (
                    <span className={styles.usIndicator}>← WE ARE HERE</span>
                  )}
                </div>
                <p className={styles.layerDesc}>{layer.description}</p>

                {expandedLayer === layer.id && (
                  <div className={styles.layerCompanies}>
                    {layer.companies.map((company) => (
                      <span
                        key={company}
                        className={`${styles.companyTag} ${company === "Cash Tropic" || company === "You" ? styles.highlight : ""}`}
                        style={{ borderColor: layer.color }}
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Situational Insights */}
          <div className={styles.insightsGrid}>
            {situationalInsights.map((insight) => (
              <div key={insight.title} className={styles.insightCard}>
                <span className={styles.insightIcon}>{insight.icon}</span>
                <div className={styles.insightContent}>
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                  <span className={styles.insightSource}>{insight.source}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Energy Control Function */}
          <div className={styles.energySection}>
            <h3>⚡ Energy Control Function</h3>
            <div className={styles.energyViz}>
              <div className={styles.energyFlow}>
                <span className={styles.energyNode}>🌍 Grid</span>
                <span className={styles.energyArrow}>→</span>
                <span className={styles.energyNode}>🏭 Data Center</span>
                <span className={styles.energyArrow}>→</span>
                <span className={styles.energyNode}>⚡ GPUs</span>
                <span className={styles.energyArrow}>→</span>
                <span className={styles.energyNode}>🧠 Intelligence</span>
                <span className={styles.energyArrow}>→</span>
                <span className={styles.energyNode}>💰 Value</span>
              </div>
              <p className={styles.energyNote}>
                Whoever controls energy controls compute. Whoever controls
                compute controls AI. Whoever controls AI controls value
                creation. The stack is the strategy.
              </p>
            </div>
          </div>

          {/* Resources & Videos */}
          <div className={styles.resourcesSection}>
            <h3>📺 Key Resources</h3>
            <div className={styles.resourcesGrid}>
              <a
                href="https://situational-awareness.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resourceCard}
              >
                <span className={styles.resourceIcon}>📄</span>
                <div>
                  <strong>Situational Awareness</strong>
                  <p>Leopold Aschenbrenner&apos;s thesis on AGI timelines</p>
                </div>
              </a>
              <a
                href="https://www.youtube.com/watch?v=6-hx3r9X4qk"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resourceCard}
              >
                <span className={styles.resourceIcon}>🎥</span>
                <div>
                  <strong>Elon on AI</strong>
                  <p>xAI, Grok, and the race to AGI</p>
                </div>
              </a>
              <a
                href="https://epochai.org/trends"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resourceCard}
              >
                <span className={styles.resourceIcon}>📊</span>
                <div>
                  <strong>Epoch AI Trends</strong>
                  <p>Compute growth and AI progress tracking</p>
                </div>
              </a>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className={styles.imageUploadSection}>
            <h3>🖼️ Vision Board</h3>
            <p className={styles.sectionDesc}>
              Add images to visualize your AI future
            </p>

            <div className={styles.imageUploadArea}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;

                  setIsUploadingImage(true);
                  // For now, use local URLs - can integrate with Vercel Blob later
                  const newImages = Array.from(files).map((file) =>
                    URL.createObjectURL(file),
                  );
                  setVisionImages([...visionImages, ...newImages]);
                  setIsUploadingImage(false);
                }}
                className={styles.fileInput}
                id="vision-upload"
              />
              <label htmlFor="vision-upload" className={styles.uploadLabel}>
                {isUploadingImage
                  ? "Uploading..."
                  : "📎 Drop images or click to upload"}
              </label>
            </div>

            {visionImages.length > 0 && (
              <div className={styles.visionBoard}>
                {visionImages.map((img, idx) => (
                  <div key={idx} className={styles.visionImageWrapper}>
                    <img
                      src={img}
                      alt={`Vision ${idx + 1}`}
                      className={styles.visionImage}
                    />
                    <button
                      className={styles.removeImage}
                      onClick={() =>
                        setVisionImages(
                          visionImages.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

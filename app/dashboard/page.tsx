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
      </div>
    </div>
  );
}

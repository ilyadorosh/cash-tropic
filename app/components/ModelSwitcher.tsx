"use client";

import React, { useState, useEffect } from "react";

export interface AIModel {
  id: string;
  name: string;
  provider:
    | "openai"
    | "anthropic"
    | "google"
    | "groq"
    | "sambanova"
    | "local"
    | "custom";
  description?: string;
  available: boolean;
  isCustom?: boolean;
}

interface ModelSwitcherProps {
  currentModel?: string;
  onModelSelect?: (modelId: string) => void;
  className?: string;
}

/**
 * ModelSwitcher - Like switching cars in GTA
 * Allows seamless switching between AI models
 */
export function ModelSwitcher({
  currentModel = "gpt-4",
  onModelSelect,
  className = "",
}: ModelSwitcherProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/models/list");
      if (response.ok) {
        const data = await response.json();
        setModels(data.models);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      // Use fallback models
      setModels(FALLBACK_MODELS);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSwitch = async (modelId: string) => {
    if (modelId === currentModel) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const response = await fetch("/api/models/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });

      if (response.ok) {
        onModelSelect?.(modelId);
      }
    } catch (error) {
      console.error("Failed to switch model:", error);
    } finally {
      setSwitching(false);
      setIsOpen(false);
    }
  };

  const getProviderColor = (provider: AIModel["provider"]): string => {
    const colors: Record<AIModel["provider"], string> = {
      openai: "#10a37f",
      anthropic: "#c96442",
      google: "#4285f4",
      groq: "#f55036",
      sambanova: "#ff6600",
      local: "#888888",
      custom: "#9966ff",
    };
    return colors[provider];
  };

  const getProviderIcon = (provider: AIModel["provider"]): string => {
    const icons: Record<AIModel["provider"], string> = {
      openai: "🤖",
      anthropic: "🧠",
      google: "💎",
      groq: "⚡",
      sambanova: "🔥",
      local: "💻",
      custom: "🎯",
    };
    return icons[provider];
  };

  const currentModelData = models.find((m) => m.id === currentModel);

  return (
    <div
      className={`model-switcher ${className}`}
      style={{ position: "relative" }}
    >
      {/* Current Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || switching}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          background: "rgba(30, 30, 60, 0.8)",
          border: "1px solid rgba(100, 100, 255, 0.3)",
          borderRadius: "8px",
          color: "#e0e0e0",
          cursor: "pointer",
          fontSize: "0.9rem",
          minWidth: "200px",
          transition: "all 0.2s ease",
        }}
      >
        {loading ? (
          <span>Loading models...</span>
        ) : switching ? (
          <span>Switching...</span>
        ) : (
          <>
            <span style={{ fontSize: "1.2rem" }}>
              {currentModelData
                ? getProviderIcon(currentModelData.provider)
                : "🤖"}
            </span>
            <span style={{ flex: 1, textAlign: "left" }}>
              {currentModelData?.name || currentModel}
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "2px 6px",
                background: currentModelData
                  ? getProviderColor(currentModelData.provider)
                  : "#888",
                borderRadius: "4px",
                color: "#fff",
              }}
            >
              {currentModelData?.provider || "unknown"}
            </span>
            <span style={{ marginLeft: "4px" }}>{isOpen ? "▲" : "▼"}</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && !loading && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "rgba(20, 20, 40, 0.98)",
            border: "1px solid rgba(100, 100, 255, 0.3)",
            borderRadius: "8px",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Group by provider */}
          {[
            "openai",
            "anthropic",
            "google",
            "groq",
            "sambanova",
            "custom",
            "local",
          ].map((provider) => {
            const providerModels = models.filter(
              (m) => m.provider === provider,
            );
            if (providerModels.length === 0) return null;

            return (
              <div key={provider}>
                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.7rem",
                    color: "#888",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    background: "rgba(50, 50, 80, 0.3)",
                    borderBottom: "1px solid rgba(100, 100, 255, 0.1)",
                  }}
                >
                  {getProviderIcon(provider as AIModel["provider"])} {provider}
                </div>
                {providerModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSwitch(model.id)}
                    disabled={!model.available}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      background:
                        model.id === currentModel
                          ? "rgba(100, 100, 255, 0.2)"
                          : "transparent",
                      border: "none",
                      borderBottom: "1px solid rgba(100, 100, 255, 0.1)",
                      color: model.available ? "#e0e0e0" : "#666",
                      cursor: model.available ? "pointer" : "not-allowed",
                      textAlign: "left",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (model.available) {
                        e.currentTarget.style.background =
                          "rgba(100, 100, 255, 0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        model.id === currentModel
                          ? "rgba(100, 100, 255, 0.2)"
                          : "transparent";
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{model.name}</div>
                      {model.description && (
                        <div style={{ fontSize: "0.75rem", color: "#888" }}>
                          {model.description}
                        </div>
                      )}
                    </span>
                    {model.isCustom && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          padding: "2px 6px",
                          background: "#9966ff",
                          borderRadius: "4px",
                          color: "#fff",
                        }}
                      >
                        CUSTOM
                      </span>
                    )}
                    {model.id === currentModel && (
                      <span style={{ color: "#66ff88" }}>✓</span>
                    )}
                    {!model.available && (
                      <span style={{ fontSize: "0.7rem", color: "#ff6666" }}>
                        Unavailable
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Fallback models when API is unavailable
const FALLBACK_MODELS: AIModel[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "openai",
    available: true,
    description: "Most capable OpenAI model",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    available: true,
    description: "Faster GPT-4",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    available: true,
    description: "Fast and efficient",
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "anthropic",
    available: true,
    description: "Most capable Claude",
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "anthropic",
    available: true,
    description: "Balanced performance",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "google",
    available: true,
    description: "Google's multimodal AI",
  },
  {
    id: "llama-3.1-70b",
    name: "Llama 3.1 70B",
    provider: "groq",
    available: true,
    description: "Fast inference",
  },
  {
    id: "sambanova-1",
    name: "SambaNova Cloud",
    provider: "sambanova",
    available: true,
    description: "High-speed inference",
  },
  {
    id: "custom-energy-model",
    name: "Energy Model v1",
    provider: "custom",
    available: false,
    isCustom: true,
    description: "Training in progress...",
  },
  {
    id: "local-llama",
    name: "Local LLaMA",
    provider: "local",
    available: false,
    description: "Run on device",
  },
];

export default ModelSwitcher;

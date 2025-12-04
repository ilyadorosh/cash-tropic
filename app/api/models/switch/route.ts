import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/models/switch
 * Switch the active AI model - stores preference and validates availability
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: "modelId is required" },
        { status: 400 },
      );
    }

    // Validate model exists and is available
    const modelConfig = getModelConfig(modelId);

    if (!modelConfig) {
      return NextResponse.json(
        { error: "Unknown model", modelId },
        { status: 404 },
      );
    }

    // Check if required API key is available
    const isAvailable = checkModelAvailability(modelConfig.provider);

    if (!isAvailable) {
      return NextResponse.json(
        {
          error: "Model not available",
          modelId,
          reason: `Missing API key for ${modelConfig.provider}`,
        },
        { status: 503 },
      );
    }

    // In a production app, you would:
    // 1. Store the preference in Redis/Postgres
    // 2. Update the user's session
    // For now, we just validate and return success

    return NextResponse.json({
      success: true,
      modelId,
      model: modelConfig,
      message: `Switched to ${modelConfig.name}`,
    });
  } catch (error) {
    console.error("Model switch error:", error);
    return NextResponse.json(
      { error: "Failed to switch model" },
      { status: 500 },
    );
  }
}

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  apiEndpoint?: string;
}

function getModelConfig(modelId: string): ModelConfig | null {
  const models: Record<string, ModelConfig> = {
    // OpenAI
    "gpt-4": { id: "gpt-4", name: "GPT-4", provider: "openai" },
    "gpt-4-turbo": {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
    },
    "gpt-4o": { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
    "gpt-3.5-turbo": {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "openai",
    },

    // Anthropic
    "claude-3-opus-20240229": {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      provider: "anthropic",
    },
    "claude-3-sonnet-20240229": {
      id: "claude-3-sonnet-20240229",
      name: "Claude 3 Sonnet",
      provider: "anthropic",
    },
    "claude-3-haiku-20240307": {
      id: "claude-3-haiku-20240307",
      name: "Claude 3 Haiku",
      provider: "anthropic",
    },

    // Google
    "gemini-pro": { id: "gemini-pro", name: "Gemini Pro", provider: "google" },
    "gemini-pro-vision": {
      id: "gemini-pro-vision",
      name: "Gemini Pro Vision",
      provider: "google",
    },

    // Groq
    "llama-3.1-70b-versatile": {
      id: "llama-3.1-70b-versatile",
      name: "Llama 3.1 70B",
      provider: "groq",
    },
    "llama-3.1-8b-instant": {
      id: "llama-3.1-8b-instant",
      name: "Llama 3.1 8B",
      provider: "groq",
    },
    "mixtral-8x7b-32768": {
      id: "mixtral-8x7b-32768",
      name: "Mixtral 8x7B",
      provider: "groq",
    },

    // SambaNova
    "sambanova-llama3-405b": {
      id: "sambanova-llama3-405b",
      name: "Llama 3 405B",
      provider: "sambanova",
    },

    // Custom (user-trained models)
    "custom-energy-model-v1": {
      id: "custom-energy-model-v1",
      name: "Energy Model v1",
      provider: "custom",
    },
    "custom-thermodynamics-v1": {
      id: "custom-thermodynamics-v1",
      name: "Thermodynamics AI",
      provider: "custom",
    },

    // Local
    "local-llama-7b": {
      id: "local-llama-7b",
      name: "Local LLaMA 7B",
      provider: "local",
    },
    "local-mistral-7b": {
      id: "local-mistral-7b",
      name: "Local Mistral 7B",
      provider: "local",
    },
  };

  return models[modelId] || null;
}

function checkModelAvailability(provider: string): boolean {
  switch (provider) {
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    case "google":
      return !!process.env.GOOGLE_API_KEY;
    case "groq":
      return !!process.env.GROQ_API_KEY;
    case "sambanova":
      return !!process.env.SAMBANOVA_API_KEY;
    case "custom":
      // Custom models need their own endpoint configured
      return false;
    case "local":
      // Local models need Ollama or similar running
      return false;
    default:
      return false;
  }
}

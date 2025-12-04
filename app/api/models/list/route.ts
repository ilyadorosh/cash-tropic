import { NextResponse } from "next/server";

/**
 * GET /api/models/list
 * Returns available AI models (local + API-based)
 */
export async function GET() {
  // Check which API keys are available
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasSambaNova = !!process.env.SAMBANOVA_API_KEY;

  const models = [
    // OpenAI Models
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "openai",
      available: hasOpenAI,
      description: "Most capable OpenAI model for complex tasks",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      available: hasOpenAI,
      description: "Faster GPT-4 with 128k context",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      available: hasOpenAI,
      description: "Optimized GPT-4 for speed and quality",
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "openai",
      available: hasOpenAI,
      description: "Fast and cost-effective",
    },

    // Anthropic Models
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      provider: "anthropic",
      available: hasAnthropic,
      description: "Most capable Claude model",
    },
    {
      id: "claude-3-sonnet-20240229",
      name: "Claude 3 Sonnet",
      provider: "anthropic",
      available: hasAnthropic,
      description: "Balanced performance and speed",
    },
    {
      id: "claude-3-haiku-20240307",
      name: "Claude 3 Haiku",
      provider: "anthropic",
      available: hasAnthropic,
      description: "Fastest Claude model",
    },

    // Google Models
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      provider: "google",
      available: hasGoogle,
      description: "Google's advanced multimodal AI",
    },
    {
      id: "gemini-pro-vision",
      name: "Gemini Pro Vision",
      provider: "google",
      available: hasGoogle,
      description: "Multimodal with image understanding",
    },

    // Groq Models (fast inference)
    {
      id: "llama-3.1-70b-versatile",
      name: "Llama 3.1 70B",
      provider: "groq",
      available: hasGroq,
      description: "High-quality open model on Groq",
    },
    {
      id: "llama-3.1-8b-instant",
      name: "Llama 3.1 8B",
      provider: "groq",
      available: hasGroq,
      description: "Ultra-fast inference",
    },
    {
      id: "mixtral-8x7b-32768",
      name: "Mixtral 8x7B",
      provider: "groq",
      available: hasGroq,
      description: "MoE architecture on Groq",
    },

    // SambaNova Models
    {
      id: "sambanova-llama3-405b",
      name: "Llama 3 405B",
      provider: "sambanova",
      available: hasSambaNova,
      description: "Largest Llama on SambaNova hardware",
    },

    // Custom Models (placeholder for user training)
    {
      id: "custom-energy-model-v1",
      name: "Energy Model v1",
      provider: "custom",
      available: false,
      isCustom: true,
      description: "Custom trained model - training in progress",
    },
    {
      id: "custom-thermodynamics-v1",
      name: "Thermodynamics AI",
      provider: "custom",
      available: false,
      isCustom: true,
      description: "Specialized for physics understanding",
    },

    // Local Models
    {
      id: "local-llama-7b",
      name: "Local LLaMA 7B",
      provider: "local",
      available: false,
      description: "Run on your device (not configured)",
    },
    {
      id: "local-mistral-7b",
      name: "Local Mistral 7B",
      provider: "local",
      available: false,
      description: "Run on your device (not configured)",
    },
  ];

  return NextResponse.json({
    models,
    defaultModel: hasOpenAI
      ? "gpt-4"
      : hasAnthropic
      ? "claude-3-sonnet-20240229"
      : "llama-3.1-70b-versatile",
  });
}

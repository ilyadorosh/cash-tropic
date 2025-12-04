import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/models/inference
 * Unified inference endpoint - routes to appropriate provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, messages, temperature = 0.7, maxTokens = 2048 } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: "modelId is required" },
        { status: 400 },
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 },
      );
    }

    // Route to appropriate provider
    const provider = getProvider(modelId);

    switch (provider) {
      case "openai":
        return await handleOpenAI(modelId, messages, temperature, maxTokens);
      case "anthropic":
        return await handleAnthropic(modelId, messages, temperature, maxTokens);
      case "google":
        return await handleGoogle(modelId, messages, temperature, maxTokens);
      case "groq":
        return await handleGroq(modelId, messages, temperature, maxTokens);
      case "sambanova":
        return await handleSambaNova(modelId, messages, temperature, maxTokens);
      case "custom":
        return NextResponse.json(
          { error: "Custom models not yet available", modelId },
          { status: 503 },
        );
      case "local":
        return NextResponse.json(
          { error: "Local models not configured", modelId },
          { status: 503 },
        );
      default:
        return NextResponse.json(
          { error: "Unknown model provider", modelId },
          { status: 404 },
        );
    }
  } catch (error) {
    console.error("Inference error:", error);
    return NextResponse.json({ error: "Inference failed" }, { status: 500 });
  }
}

function getProvider(modelId: string): string {
  if (modelId.startsWith("gpt-")) return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  if (modelId.startsWith("gemini-")) return "google";
  if (modelId.startsWith("llama-") || modelId.startsWith("mixtral-"))
    return "groq";
  if (modelId.startsWith("sambanova-")) return "sambanova";
  if (modelId.startsWith("custom-")) return "custom";
  if (modelId.startsWith("local-")) return "local";
  return "unknown";
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

async function handleOpenAI(
  modelId: string,
  messages: Message[],
  temperature: number,
  maxTokens: number,
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json(
      { error: "OpenAI API error", details: error },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json({
    response: data.choices[0]?.message?.content,
    usage: data.usage,
    model: modelId,
    provider: "openai",
  });
}

async function handleAnthropic(
  modelId: string,
  messages: Message[],
  temperature: number,
  maxTokens: number,
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API key not configured" },
      { status: 503 },
    );
  }

  // Convert to Anthropic format
  const systemMessage =
    messages.find((m) => m.role === "system")?.content || "";
  const anthropicMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      messages: anthropicMessages,
      system: systemMessage,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json(
      { error: "Anthropic API error", details: error },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json({
    response: data.content[0]?.text,
    usage: data.usage,
    model: modelId,
    provider: "anthropic",
  });
}

async function handleGoogle(
  modelId: string,
  messages: Message[],
  temperature: number,
  maxTokens: number,
) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google API key not configured" },
      { status: 503 },
    );
  }

  // Convert to Google format
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json(
      { error: "Google API error", details: error },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json({
    response: data.candidates?.[0]?.content?.parts?.[0]?.text,
    model: modelId,
    provider: "google",
  });
}

async function handleGroq(
  modelId: string,
  messages: Message[],
  temperature: number,
  maxTokens: number,
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Groq API key not configured" },
      { status: 503 },
    );
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json(
      { error: "Groq API error", details: error },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json({
    response: data.choices[0]?.message?.content,
    usage: data.usage,
    model: modelId,
    provider: "groq",
  });
}

async function handleSambaNova(
  modelId: string,
  messages: Message[],
  temperature: number,
  maxTokens: number,
) {
  const apiKey = process.env.SAMBANOVA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SambaNova API key not configured" },
      { status: 503 },
    );
  }

  // SambaNova uses OpenAI-compatible API
  const response = await fetch("https://api.sambanova.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId.replace("sambanova-", ""),
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json(
      { error: "SambaNova API error", details: error },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json({
    response: data.choices[0]?.message?.content,
    usage: data.usage,
    model: modelId,
    provider: "sambanova",
  });
}

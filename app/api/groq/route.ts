import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return NextResponse.json(
      { error: "Missing prompt parameter" },
      { status: 400 }
    );
  }

  return handleGroqRequest(prompt);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt in request body" },
        { status: 400 }
      );
    }

    return handleGroqRequest(prompt);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }
}

async function handleGroqRequest(prompt: string) {
  const groqApiUrl = process.env.GROQ_API_URL;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiUrl) {
    return NextResponse.json(
      { error: "GROQ_API_URL environment variable is not configured" },
      { status: 500 }
    );
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (groqApiKey) {
      headers.Authorization = `Bearer ${groqApiKey}`;
    }

    const response = await fetch(groqApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error calling Groq API:", error);
    return NextResponse.json(
      { error: "Failed to call Groq API" },
      { status: 500 }
    );
  }
}

export const runtime = "edge";
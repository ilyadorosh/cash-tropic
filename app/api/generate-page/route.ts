import { NextRequest, NextResponse } from "next/server";
import {
  getProfileByUsername,
  saveGeneratedPage,
  getGeneratedPage,
} from "@/app/lib/drizzle";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, say } = body;

    // Validate input
    if (!from || !to) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' parameters are required" },
        { status: 400 },
      );
    }

    // Check if page already exists in cache
    const existingPage = await getGeneratedPage({
      fromUsername: from,
      toUsername: to,
      customPrompt: say || undefined,
    });

    if (existingPage) {
      return NextResponse.json({
        success: true,
        html: existingPage.generatedHtml,
        cached: true,
      });
    }

    // Fetch profiles from database
    const fromProfile = await getProfileByUsername({ username: from });
    const toProfile = await getProfileByUsername({ username: to });

    if (!fromProfile) {
      return NextResponse.json(
        { error: `Profile not found for username: ${from}` },
        { status: 404 },
      );
    }

    if (!toProfile) {
      return NextResponse.json(
        { error: `Profile not found for username: ${to}` },
        { status: 404 },
      );
    }

    // Construct LLM prompt
    const prompt = constructPrompt(
      fromProfile.username,
      fromProfile.context || "",
      toProfile.username,
      toProfile.context || "",
      say,
    );

    // Call LLM to generate content
    const generatedHtml = await generateWithLLM(prompt);

    // Save to database
    await saveGeneratedPage({
      fromProfileId: fromProfile.id,
      toProfileId: toProfile.id,
      customPrompt: say || undefined,
      generatedHtml,
    });

    return NextResponse.json({
      success: true,
      html: generatedHtml,
      cached: false,
    });
  } catch (error) {
    console.error("Error generating page:", error);
    return NextResponse.json(
      {
        error: "Failed to generate page",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function constructPrompt(
  fromUsername: string,
  fromContext: string,
  toUsername: string,
  toContext: string,
  customMessage?: string,
): string {
  const basePrompt = `You are creating a beautiful, heartfelt webpage for ${fromUsername} to send to ${toUsername}.

Context about ${fromUsername}:
${fromContext || "No additional context provided."}

Context about ${toUsername}:
${toContext || "No additional context provided."}

${customMessage ? `Special message: ${customMessage}` : ""}

Create a complete, self-contained HTML page that:
1. Is visually beautiful with modern CSS styling
2. Is responsive and works on mobile devices
3. Expresses genuine emotion and connection between ${fromUsername} and ${toUsername}
4. Incorporates the context about both people
5. ${customMessage ? `Incorporates the special message: "${customMessage}"` : ""}
6. Includes no external dependencies (all CSS must be inline or in a <style> tag)

Return ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>. Do not include any explanations or markdown code blocks.`;

  return basePrompt;
}

async function generateWithLLM(prompt: string): Promise<string> {
  // Get API key from environment
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Call OpenAI API
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a creative web designer who creates beautiful, emotional HTML pages. You always return valid, complete HTML code.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`,
    );
  }

  const data = await response.json();
  const generatedContent = data.choices[0]?.message?.content;

  if (!generatedContent) {
    throw new Error("No content generated from LLM");
  }

  // Clean up the response (remove markdown code blocks if present)
  let html = generatedContent.trim();
  if (html.startsWith("```html")) {
    html = html.replace(/```html\n?/g, "").replace(/```\n?$/g, "");
  } else if (html.startsWith("```")) {
    html = html.replace(/```\n?/g, "").replace(/```\n?$/g, "");
  }

  return html.trim();
}

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requestGroq } from "@/app/api/common";

export async function POST(req: NextRequest) {
  try {
    const { character, context, systemPrompt } = await req.json();

    const requestBody = {
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Here's a context piece: "${context}"\n\nRespond briefly with your perspective and add relevant emojis. Keep it to 1-2 sentences max.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    };

    const mockRequest = new NextRequest(
      new URL("http://localhost:3000/api/groq/v1/chat/completions"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`,
        },
        body: JSON.stringify(requestBody),
      },
    );

    const groqResponse = await requestGroq(mockRequest);
    const responseData = await groqResponse.json();

    const generatedContent = responseData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated from LLM");
    }

    return NextResponse.json({
      character,
      response: generatedContent.trim(),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";

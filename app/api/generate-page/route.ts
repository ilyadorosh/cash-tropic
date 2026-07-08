import { NextRequest, NextResponse } from "next/server";
import {
  getProfileByUsername,
  saveGeneratedPage,
  getGeneratedPage,
} from "@/app/lib/drizzle";
import {
  getCachedProfile,
  setCachedProfile,
  getCachedPageHtml,
  setCachedPageHtml,
  trackPageView,
  trackPageCreated,
} from "@/app/lib/redis";
import { requestGroq } from "@/app/api/common";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, say } = body;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' parameters are required" },
        { status: 400 },
      );
    }

    // ── 1. Profile lookups: Redis L1 → Postgres ────────────────────────────
    let [fromProfile, toProfile] = await Promise.all([
      getCachedProfile(from),
      getCachedProfile(to),
    ]);

    if (!fromProfile) {
      const row = await getProfileByUsername({ username: from });
      if (!row) {
        return NextResponse.json(
          { error: `Profile not found for username: ${from}` },
          { status: 404 },
        );
      }
      fromProfile = {
        id: row.id,
        username: row.username,
        context: row.context,
      };
      await setCachedProfile(from, fromProfile);
    }

    if (!toProfile) {
      const row = await getProfileByUsername({ username: to });
      if (!row) {
        return NextResponse.json(
          { error: `Profile not found for username: ${to}` },
          { status: 404 },
        );
      }
      toProfile = { id: row.id, username: row.username, context: row.context };
      await setCachedProfile(to, toProfile);
    }

    // ── 2. Page HTML: Redis L1 → Postgres L2 → generate ──────────────────
    const cachedHtml = await getCachedPageHtml(from, to, say);

    if (cachedHtml) {
      await trackPageView(from, to);
      return NextResponse.json({
        success: true,
        html: cachedHtml,
        cached: true,
        fromProfile: {
          username: fromProfile.username,
          context: fromProfile.context,
        },
        toProfile: { username: toProfile.username, context: toProfile.context },
      });
    }

    // Check Postgres L2 cache
    const dbPage = await getGeneratedPage({
      fromUsername: from,
      toUsername: to,
      customPrompt: say || undefined,
    });

    if (dbPage?.generatedHtml) {
      await Promise.all([
        setCachedPageHtml(from, to, dbPage.generatedHtml, say),
        trackPageView(from, to),
      ]);
      return NextResponse.json({
        success: true,
        html: dbPage.generatedHtml,
        cached: true,
        fromProfile: {
          username: fromProfile.username,
          context: fromProfile.context,
        },
        toProfile: { username: toProfile.username, context: toProfile.context },
      });
    }

    // ── 3. Generate with LLM ──────────────────────────────────────────────
    const prompt = constructPrompt(
      fromProfile.username,
      fromProfile.context || "",
      toProfile.username,
      toProfile.context || "",
      say,
    );

    const generatedHtml = await generateWithLLM(prompt);

    // Save to Postgres + Redis in parallel
    await Promise.all([
      saveGeneratedPage({
        fromProfileId: fromProfile.id,
        toProfileId: toProfile.id,
        customPrompt: say || undefined,
        generatedHtml,
      }),
      setCachedPageHtml(from, to, generatedHtml, say),
      trackPageView(from, to),
      trackPageCreated(from, to),
    ]);

    return NextResponse.json({
      success: true,
      html: generatedHtml,
      cached: false,
      fromProfile: {
        username: fromProfile.username,
        context: fromProfile.context,
      },
      toProfile: { username: toProfile.username, context: toProfile.context },
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
  return `You are creating a beautiful, heartfelt webpage for ${fromUsername} to send to ${toUsername}.

Context about ${fromUsername}:
${fromContext || "No additional context provided."}

Context about ${toUsername}:
${toContext || "No additional context provided."}

${customMessage ? `Special message: ${customMessage}` : ""}

Create a complete, self-contained HTML page that:
1. Is visually beautiful with modern CSS styling. If images are used, use valid URLs, or not at all.
2. Is responsive and works on mobile devices
3. Expresses genuine emotion and connection between ${fromUsername} and ${toUsername}
4. Incorporates the context about both people
5. ${customMessage ? `Incorporates the special message: "${customMessage}"` : ""}
6. Includes no external dependencies (all CSS must be inline or in a <style> tag)

Return ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>. Do not include any explanations or markdown code blocks.`;
}

async function generateWithLLM(prompt: string): Promise<string> {
  const requestBody = {
    messages: [{ role: "user", content: prompt }],
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
  if (!generatedContent) throw new Error("No content generated from LLM");

  let html = generatedContent.trim();
  if (html.startsWith("```html")) {
    html = html.replace(/```html\n?/g, "").replace(/```\n?$/g, "");
  } else if (html.startsWith("```")) {
    html = html.replace(/```\n?/g, "").replace(/```\n?$/g, "");
  }

  return html.trim();
}

export const runtime = "nodejs";

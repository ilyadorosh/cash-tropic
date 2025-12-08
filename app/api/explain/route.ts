import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { concept, context } = body;

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!groqKey && !openaiKey) {
      return NextResponse.json({
        explanation: `📚 ${concept}\n\nNo AI API key configured. But here's a hint: This concept connects information theory to thermodynamics. Szilard (1929) showed that erasing 1 bit costs kT ln 2 energy.`,
        source: "fallback"
      });
    }

    const prompt = `You are a brilliant physics teacher explaining concepts to a curious student who wants deep understanding.

CONCEPT TO EXPLAIN:
"${concept}"

${context ? `CONTEXT: ${context}` : ""}

Explain in this structure:
1. 🎯 SIMPLE EXPLANATION (like explaining to a smart 15-year-old)
2. 🔬 DEEP PHYSICS (the real mechanics, equations if relevant)
3. 🔗 CONNECTIONS (how this relates to: entropy, information theory, Szilard's engine, Landauer's principle)
4. ⚡ WHY IT MATTERS (for energy systems, computation, or understanding the universe)

Be engaging but rigorous. Use emojis sparingly. Keep under 400 words.`;

    // Try Groq first (fastest)
    if (groqKey) {
      try {
        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${groqKey}` 
          },
          body: JSON.stringify({ 
            model: "llama-3.3-70b-versatile", 
            max_tokens: 800, 
            temperature: 0.7, 
            messages: [{ role: "user", content: prompt }] 
          })
        });
        
        if (resp.ok) {
          const d = await resp.json();
          const text = d.choices?.[0]?.message?.content || "Explanation unavailable";
          return NextResponse.json({ explanation: text, source: "groq" });
        } else {
          console.error("[Groq Error]", resp.status, await resp.text());
        }
      } catch (e) {
        console.error("Groq error", e);
      }
    }

    // OpenAI fallback
    if (openaiKey) {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${openaiKey}` 
          },
          body: JSON.stringify({ 
            model: "gpt-4o-mini", 
            max_tokens: 800, 
            temperature: 0.7, 
            messages: [{ role: "user", content: prompt }] 
          })
        });
        
        if (resp.ok) {
          const d = await resp.json();
          const text = d.choices?.[0]?.message?.content || "Explanation unavailable";
          return NextResponse.json({ explanation: text, source: "openai" });
        }
      } catch (e) {
        console.error("OpenAI error", e);
      }
    }

    return NextResponse.json({ 
      explanation: "Could not connect to AI providers.", 
      source: "error" 
    });

  } catch (error) {
    console.error("Explain API error:", error);
    return NextResponse.json({ explanation: "Error processing request", source: "error" }, { status: 500 });
  }
}

// GET endpoint to list available Groq models
export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  
  if (!groqKey) {
    return NextResponse.json({ models: [], error: "No GROQ_API_KEY" });
  }

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${groqKey}` }
    });
    
    if (resp.ok) {
      const data = await resp.json();
      // Filter to just the useful text models
      const textModels = data.data?.filter((m: any) => 
        m.id.includes("llama") || m.id.includes("gpt") || m.id.includes("qwen")
      ).map((m: any) => ({
        id: m.id,
        owned_by: m.owned_by,
        context_window: m.context_window
      }));
      return NextResponse.json({ models: textModels });
    }
  } catch (e) {
    console.error("Models fetch error", e);
  }
  
  return NextResponse.json({ models: [] });
}

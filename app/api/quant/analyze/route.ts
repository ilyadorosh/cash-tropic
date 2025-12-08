import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, name, price, change24h, volume } = body;

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    // prefer Groq, fallback to OpenAI, then Google (if configured server-side)
    if (!groqKey && !openaiKey && !googleKey) {
      // Return rule-based analysis if no API key
      const sentiment = change24h > 3 ? "Strong bullish" : 
                       change24h > 0 ? "Mildly bullish" :
                       change24h > -3 ? "Mildly bearish" : "Strong bearish";
      const volumeRank = volume > 10_000_000_000 ? "Very High" : 
                        volume > 1_000_000_000 ? "High" : "Medium";
      
      return NextResponse.json({
        analysis: `📊 ${symbol} - Rule-based Analysis\n\n` +
          `Sentiment: ${sentiment} ${change24h > 0 ? "📈" : "📉"}\n` +
          `Volume: ${volumeRank}\n` +
          `Tip: ${Math.abs(change24h) > 5 ? "High volatility - consider waiting" : "Normal range"}`,
        source: "rule-based"
      });
    }

    // Format numbers safely
    const priceStr = typeof price === 'number' ? price.toFixed(2) : String(price);
    const changeStr = typeof change24h === 'number' ? change24h.toFixed(2) : String(change24h);
    const volStr = typeof volume === 'number' ? (volume / 1_000_000_000).toFixed(2) : "?";

    // Build prompt
    const prompt = `Analyze ${symbol} (${name}): Price $${priceStr}, 24h change ${changeStr}%, Volume $${volStr}B. Give 2-3 sentences: sentiment and recommendation. Be direct.`;

    // GROQ
    if (groqKey) {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", max_tokens: 150, temperature: 0.7, messages: [{ role: "user", content: prompt }] })
      });
      if (resp.ok) {
        const d = await resp.json();
        const text = d.choices?.[0]?.message?.content || "Analysis unavailable";
        return NextResponse.json({ analysis: `🤖 ${text}`, source: "groq" });
      } else {
        const err = await resp.text();
        console.error("[Groq Error]", resp.status, err);
      }
    }

    // OpenAI fallback
    if (openaiKey) {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: "gpt-3.5-turbo", max_tokens: 150, temperature: 0.7, messages: [{ role: "user", content: prompt }] })
        });
        if (resp.ok) {
          const d = await resp.json();
          const text = d.choices?.[0]?.message?.content || "Analysis unavailable";
          return NextResponse.json({ analysis: `🤖 ${text}`, source: "openai" });
        } else {
          const err = await resp.text();
          console.error("[OpenAI Error]", resp.status, err);
        }
      } catch (e) {
        console.error("OpenAI fallback error", e);
      }
    }

    // Google fallback (if user configured server-side Google credentials)
    if (googleKey) {
      try {
        const resp = await fetch("https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${googleKey}` },
          body: JSON.stringify({ prompt: { text: prompt }, maxOutputTokens: 150 })
        });
        if (resp.ok) {
          const d = await resp.json();
          const text = d.candidates?.[0]?.content || "Analysis unavailable";
          return NextResponse.json({ analysis: `🤖 ${text}`, source: "google" });
        } else {
          const err = await resp.text();
          console.error("[Google Error]", resp.status, err);
        }
      } catch (e) {
        console.error("Google fallback error", e);
      }
    }

    // If all providers fail
    return NextResponse.json({ analysis: `📊 ${symbol} - Rule-based Analysis\n\nSentiment: ${change24h > 0 ? "Bullish" : "Bearish"}`, source: "rule" });

  } catch (error) {
    console.error("[Quant Analyze]", error);
    
    // Always return something useful
    return NextResponse.json({
      analysis: "📊 AI temporarily unavailable. Check price action and volume manually.",
      source: "fallback"
    });
  }
}

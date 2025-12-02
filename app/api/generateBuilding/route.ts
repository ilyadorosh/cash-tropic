import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { zone, theme, playerProgress } = await req.json();

  const themeDescriptions: Record<string, string> = {
    slums:
      "Run-down neighborhood with colorful local businesses.  Pawn shops, taquerias, barber shops, liquor stores.  Latino/Black community vibe.",
    downtown:
      "Modern urban center.  Law firms, tech companies, upscale restaurants, nightclubs. Corporate and trendy.",
    hills:
      "Wealthy exclusive area. Designer stores, wine bars, cosmetic clinics, luxury dealers. Pretentious and expensive.",
    industrial:
      "Blue-collar working area.  Warehouses, trucking, metalworks, greasy diners. Practical and rough.",
    beach:
      "Coastal tourist zone. Surf shops, seafood places, tattoo parlors, beach bars. Fun and laid-back.",
    residential:
      "Quiet neighborhood. Corner stores, laundromats, family restaurants, salons. Homey and local.",
  };

  const prompt = `Generate a unique fictional business for a GTA-style game.  

ZONE: ${zone}
VIBE: ${themeDescriptions[theme] || themeDescriptions.residential}
PLAYER PROGRESS: $${playerProgress?.money || 0}, ${
    playerProgress?.respect || 0
  } respect

Create something memorable, slightly humorous, with cultural authenticity.  Businesses should feel lived-in.  

Respond with ONLY this JSON format:
{
  "name": "Creative Business Name",
  "mainSign": "BOLD SIGN TEXT",
  "windowSign": "Slogan or offer",
  "description": "One vivid sentence about this place",
  "color": "#hexcolor",
  "owner": "Owner's first name",
  "specialty": "What makes this place unique"
}`;

  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const apiUrl =
      process.env.LLM_API_URL ||
      "https://api.groq.com/openai/v1/chat/completions";
    const model = process.env.LLM_MODEL || "llama-3.1-8b-instant";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a creative game designer.  Generate unique, culturally authentic fictional businesses.  Respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Building generation error:", error);

    // Fallback
    const fallbacks = [
      {
        name: "Joe's Place",
        mainSign: "OPEN",
        description: "A local hangout.",
        color: "#666666",
      },
      {
        name: "Quick Stop",
        mainSign: "24 HOURS",
        description: "Convenience store.",
        color: "#ff0000",
      },
      {
        name: "The Spot",
        mainSign: "COME IN",
        description: "A neighborhood favorite.",
        color: "#00aa00",
      },
    ];

    return NextResponse.json(
      fallbacks[Math.floor(Math.random() * fallbacks.length)],
    );
  }
}

// Text → image. Tries providers in order, using whichever key is configured:
//   HF_TOKEN          → Hugging Face (FLUX.1-schnell)
//   STABILITY_API_KEY → Stability AI (Stable Image Core)
//   OPENROUTER_KEY    → OpenRouter (Gemini 2.5 Flash Image)
//   OPENAI_API_KEY    → OpenAI (gpt-image-1)
// Returns raw image bytes; on total failure, JSON with every provider's error.
import { InferenceClient } from "@huggingface/inference";

export const runtime = "nodejs";
export const maxDuration = 60;

type Img = { bytes: ArrayBuffer; type: string };
type Provider = {
  name: string;
  key?: string;
  run: (p: string, k: string) => Promise<Img>;
};

const b64ToImg = (b64: string, type = "image/png"): Img => {
  const buf = Buffer.from(b64, "base64");
  return {
    bytes: buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer,
    type,
  };
};

const failText = async (r: Response) =>
  `${r.status} ${(await r.text()).slice(0, 300)}`;

const providers: Provider[] = [
  {
    name: "huggingface",
    key: process.env.HF_TOKEN,
    run: async (prompt, key) => {
      const blob = await new InferenceClient(key).textToImage(
        { model: "black-forest-labs/FLUX.1-schnell", inputs: prompt },
        { outputType: "blob" },
      );
      return {
        bytes: await blob.arrayBuffer(),
        type: blob.type || "image/png",
      };
    },
  },
  {
    name: "stability",
    key: process.env.STABILITY_API_KEY,
    run: async (prompt, key) => {
      const form = new FormData();
      form.append("prompt", prompt);
      form.append("output_format", "png");
      const r = await fetch(
        "https://api.stability.ai/v2beta/stable-image/generate/core",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, Accept: "image/*" },
          body: form,
        },
      );
      if (!r.ok) throw new Error(await failText(r));
      return { bytes: await r.arrayBuffer(), type: "image/png" };
    },
  },
  {
    name: "openrouter",
    key: process.env.OPENROUTER_KEY,
    run: async (prompt, key) => {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          modalities: ["image", "text"],
          messages: [{ role: "user", content: `Generate an image: ${prompt}` }],
        }),
      });
      if (!r.ok) throw new Error(await failText(r));
      const j = await r.json();
      const url: string | undefined =
        j?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const m = url?.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
      if (!m) throw new Error("no image in response");
      return b64ToImg(m[2], m[1]);
    },
  },
  {
    name: "openai",
    key: process.env.OPENAI_API_KEY,
    run: async (prompt, key) => {
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
        }),
      });
      if (!r.ok) throw new Error(await failText(r));
      const b64 = (await r.json())?.data?.[0]?.b64_json;
      if (!b64) throw new Error("no image in response");
      return b64ToImg(b64);
    },
  },
];

export async function POST(req: Request) {
  const { prompt } = await req.json().catch(() => ({}));
  if (!prompt || typeof prompt !== "string")
    return new Response("prompt required", { status: 400 });

  const errors: Record<string, string> = {};
  for (const p of providers) {
    if (!p.key) continue;
    try {
      const img = await p.run(prompt.slice(0, 1000), p.key);
      return new Response(img.bytes, {
        headers: {
          "Content-Type": img.type,
          "X-Image-Provider": p.name,
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      errors[p.name] = e instanceof Error ? e.message : String(e);
      console.error(`[imagine] ${p.name} failed:`, errors[p.name]);
    }
  }
  return Response.json(
    {
      error: Object.keys(errors).length
        ? "all providers failed"
        : "no image provider key configured",
      errors,
    },
    { status: 502 },
  );
}

// GET = health check: which providers are configured (never exposes keys).
export async function GET() {
  return Response.json({
    providers: providers.map((p) => ({ name: p.name, configured: !!p.key })),
  });
}

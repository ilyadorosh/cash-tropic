import { InferenceClient } from "@huggingface/inference";
export const runtime = "nodejs";

const hf = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req: Request) {
  const { prompt } = await req.json();
  if (!prompt) return new Response("prompt required", { status: 400 });
  const img = await hf.textToImage({
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
  }, { outputType: "blob" });
  return new Response(img, { headers: { "Content-Type": "image/png" } });
}

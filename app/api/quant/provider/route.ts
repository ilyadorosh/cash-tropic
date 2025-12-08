import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const providers: any = {};

  providers.groq = !!process.env.GROQ_API_KEY;
  providers.google = !!process.env.GOOGLE_API_KEY || !!process.env.GOOGLE_API_KEY_JSON;
  providers.openai = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({ providers });
}

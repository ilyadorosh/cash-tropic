// app/api/shawn/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  return NextResponse.json({ message: "Hello, World!" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(body);
    return NextResponse.json({ message: "Hello, World!", data: body });
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return NextResponse.json(
      { message: "Invalid JSON input" },
      { status: 400 },
    );
  }
}

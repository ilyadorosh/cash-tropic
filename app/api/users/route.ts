// app/api/shawn/route.ts
import { NextResponse } from "next/server";
import data from "@/myDearUsers.json";

export async function GET() {
  return NextResponse.json(data);
}

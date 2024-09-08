// app/api/shawn/route.ts
import { NextResponse } from "next/server";
import data from "@/myDearUsers.json";

export async function GET(req: Request, context: any) {
  const { params } = context;
  const user = data.filter((x) => params.userId === x.id.toString());

  return NextResponse.json(user);
}

import { NextResponse } from "next/server";

export async function GET(req: Request, context: any) {
  const { params } = context;

  const p_output = "this will be a returned response from the api here";

  return NextResponse.json({
    message: "Hello, Shawn, please go to illige.fun/safespace/prompt!",
    input: params,
    output: p_output,
  });
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    imageGenerationConfigured: Boolean(process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY),
  });
}

import { createDecartClient } from "@decartai/sdk";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

async function getApiKey(): Promise<string | undefined> {
  // 1. Check env var first
  if (process.env.DECART_API_KEY) return process.env.DECART_API_KEY;

  // 2. Fall back to stored settings
  try {
    const data = await readFile(
      path.join(process.cwd(), ".settings.json"),
      "utf-8"
    );
    const settings = JSON.parse(data);
    return settings.decartApiKey;
  } catch {
    return undefined;
  }
}

export async function POST() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "DECART_API_KEY not configured. Add it via Settings." },
      { status: 500 }
    );
  }

  const client = createDecartClient({ apiKey });

  const token = await client.tokens.create({
    expiresIn: 600,
    allowedModels: ["lucy-vton-latest"],
  });

  return NextResponse.json({ apiKey: token.apiKey, expiresAt: token.expiresAt });
}

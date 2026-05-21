import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");

async function readSettings(): Promise<Record<string, string>> {
  try {
    const data = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json({
    hasApiKey: !!(settings.decartApiKey || process.env.DECART_API_KEY),
  });
}

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();

  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
  }

  const settings = await readSettings();
  settings.decartApiKey = apiKey;

  await mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));

  return NextResponse.json({ ok: true });
}

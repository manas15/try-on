import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  const imagePath = formData.get("path") as string | null;

  if (!file || !imagePath) {
    return NextResponse.json({ error: "Missing image or path" }, { status: 400 });
  }

  // Sanitize: only allow paths under /products/
  if (!imagePath.startsWith("/products/") || imagePath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const fullPath = path.join(process.cwd(), "public", imagePath);
  const dir = path.dirname(fullPath);

  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return NextResponse.json({ ok: true, path: imagePath });
}

import { catalog } from "@/data/catalog";
import { NextResponse } from "next/server";
import { access } from "fs/promises";
import path from "path";

export async function GET() {
  const existing: Record<string, boolean> = {};

  await Promise.all(
    catalog.map(async (p) => {
      const filePath = path.join(process.cwd(), "public", p.image);
      try {
        await access(filePath);
        existing[p.id] = true;
      } catch {
        existing[p.id] = false;
      }
    })
  );

  return NextResponse.json(existing);
}

import { NextResponse } from "next/server";
import { readdir, copyFile, mkdir, stat } from "fs/promises";
import path from "path";

const ZARA_DIR = path.join(process.cwd(), "src/zara");
const PUBLIC_DIR = path.join(process.cwd(), "public/products");

async function walkDir(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walkDir(full)));
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
        files.push(full);
      }
    }
  } catch {
    // directory doesn't exist
  }
  return files;
}

export async function POST() {
  const sourceFiles = await walkDir(ZARA_DIR);
  const synced: string[] = [];

  for (const src of sourceFiles) {
    // src/zara/polos/polo-shirt.jpg -> determine category from catalog or default to men
    const rel = path.relative(ZARA_DIR, src);
    const subdir = path.dirname(rel); // e.g. "polos"
    const filename = path.basename(src);

    // Determine category folder - check if subdir hints at women
    const isWomen = /women|woman|dress|skirt|blouse/i.test(subdir);
    const category = isWomen ? "women" : "men";

    const destDir = path.join(PUBLIC_DIR, category);
    const destPath = path.join(destDir, filename);

    // Skip if destination already exists and is newer
    try {
      const srcStat = await stat(src);
      try {
        const destStat = await stat(destPath);
        if (destStat.mtimeMs >= srcStat.mtimeMs) continue;
      } catch {
        // dest doesn't exist, proceed
      }
    } catch {
      continue;
    }

    await mkdir(destDir, { recursive: true });
    await copyFile(src, destPath);
    synced.push(`${category}/${filename}`);
  }

  return NextResponse.json({ synced, total: sourceFiles.length });
}

import { findProducts } from "@/data/catalog";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  const results = findProducts(query);
  return NextResponse.json(results);
}

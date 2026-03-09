import { NextResponse } from "next/server";
import { getNotionStatus } from "@/lib/notion/adapter";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getNotionStatus());
}
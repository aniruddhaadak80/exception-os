import { NextResponse } from "next/server";
import { disconnectNotion, getNotionStatus } from "@/lib/notion/adapter";

export const runtime = "nodejs";

export async function POST() {
  await disconnectNotion();

  return NextResponse.json(await getNotionStatus());
}
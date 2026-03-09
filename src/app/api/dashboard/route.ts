import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/data";

export function GET() {
  return NextResponse.json(getDashboardSnapshot());
}
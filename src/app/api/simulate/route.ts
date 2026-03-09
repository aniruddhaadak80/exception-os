import { NextResponse } from "next/server";
import { simulateSignal } from "@/lib/data";

export async function POST() {
  return NextResponse.json(simulateSignal());
}
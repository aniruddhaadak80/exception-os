import { NextResponse } from "next/server";
import { getNotionStatus, syncWorkspaceContext } from "@/lib/notion/adapter";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string };
    const summary = await syncWorkspaceContext(body.query ?? "runbook incident escalation operating plan");

    return NextResponse.json({
      summary,
      status: await getNotionStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to sync Notion workspace context.",
      },
      { status: 400 }
    );
  }
}
import { NextResponse } from "next/server";
import { completeNotionAuth } from "@/lib/notion/adapter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const redirectUrl = new URL("/", request.url);

  if (!code || !state) {
    redirectUrl.searchParams.set("notion_error", "The Notion OAuth callback did not include the expected code or state.");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await completeNotionAuth(url.origin, code, state);
    redirectUrl.searchParams.set("notion", "connected");
  } catch (error) {
    redirectUrl.searchParams.set("notion_error", error instanceof Error ? error.message : "Unable to complete Notion OAuth.");
  }

  return NextResponse.redirect(redirectUrl);
}
import { NextResponse } from "next/server";
import { beginNotionAuth } from "@/lib/notion/adapter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const authorizationUrl = await beginNotionAuth(url.origin);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("notion_error", error instanceof Error ? error.message : "Unable to start Notion OAuth.");

    return NextResponse.redirect(redirectUrl);
  }
}
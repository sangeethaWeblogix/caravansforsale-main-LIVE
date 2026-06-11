import { NextRequest, NextResponse } from "next/server";
import { reportGitHubIssue, GitHubErrorPayload } from "@/lib/reportGitHubIssue";

export async function POST(request: NextRequest) {
  try {
    const payload: GitHubErrorPayload = await request.json();
    // Fire-and-forget — don't block the response
    reportGitHubIssue(payload).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

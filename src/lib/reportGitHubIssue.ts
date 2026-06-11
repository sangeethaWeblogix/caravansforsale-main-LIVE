const GITHUB_OWNER = "sangeethaWeblogix";
const GITHUB_REPO = "caravansforsale-main-LIVE";
const GITHUB_API = "https://api.github.com";

export interface GitHubErrorPayload {
  errorSource: "FRONTEND" | "BACKEND";
  errorType: string;
  message: string;
  pageUrl?: string;
  digest?: string;
}

export async function reportGitHubIssue(payload: GitHubErrorPayload): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return;

  const label = payload.errorSource === "BACKEND" ? "backend-error" : "frontend-error";
  const title = `[${payload.errorSource}] ${payload.errorType}`;

  try {
    // Duplicate check — skip if same open issue already exists
    const searchRes = await fetch(
      `${GITHUB_API}/search/issues?q=${encodeURIComponent(
        `repo:${GITHUB_OWNER}/${GITHUB_REPO} is:issue is:open in:title "${title}"`
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.total_count > 0) return; // already reported
    }

    const icon = payload.errorSource === "BACKEND" ? "⚙️" : "📡";
    const body = `## ${icon} ${payload.errorSource === "BACKEND" ? "Server / API Error" : "Client / Network Error"}

| Field | Value |
|---|---|
| **Source** | \`${payload.errorSource}\` |
| **Type** | ${payload.errorType} |
| **Message** | ${payload.message} |
${payload.pageUrl ? `| **Page URL** | ${payload.pageUrl} |` : ""}
${payload.digest ? `| **Digest** | \`${payload.digest}\` |` : ""}
| **Reported at** | ${new Date().toISOString()} |

---
*Auto-reported by production error handler*`;

    await fetch(`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, labels: ["bug", label] }),
    });
  } catch {
    // Never crash the app if GitHub reporting fails
  }
}

export function extractPathname(url: string): string {
  try {
    const formatted = url.startsWith("http") ? url : `https://${url}`;

    const { pathname } = new URL(formatted);

    return pathname.replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function parseExcludedUrls(excluded_urls?: string): string[] {
  if (!excluded_urls) return [];

  return excluded_urls
    .split(",")
    .map((url) => extractPathname(url.trim()))
    .filter(Boolean);
}

type Banner = {
  page_url: string;
  url_match_type: "exact" | "contains";
  excluded_urls?: string;
};

export function shouldShowBanner(
  currentPathname: string,
  banner: Banner,
): boolean {
  const cleanCurrent = currentPathname
    .replace(/\/$/, "")
    .replace(/^\/listings/, "");

  const includePath = extractPathname(banner.page_url)
    .replace(/\/$/, "")
    .replace(/^\/listings/, "");
  const excludedPaths = parseExcludedUrls(banner.excluded_urls);

  if (excludedPaths.some((path) => cleanCurrent.includes(path))) {
    return false;
  }

  if (banner.url_match_type === "exact") {
    return cleanCurrent === includePath;
  }

  if (banner.url_match_type === "contains") {
    return cleanCurrent.includes(includePath);
  }

  return false;
}

/**
 * Cleans up HTML that was pasted into the CMS from Google Sheets/Docs.
 * Strips the inline style/font junk (color, font-size, font-family,
 * data-sheets-root, etc.) and turns \r\n line breaks into real paragraphs,
 * so the content renders using the site's own typography instead of
 * whatever formatting was copied in.
 */
export function sanitizeRichText(html?: string | null): string {
  if (!html) return "";

  const withoutJunkAttrs = html
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sdata-sheets-[a-z-]*="[^"]*"/gi, "")
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "");
 
  const paragraphs = withoutJunkAttrs
    .split(/\r\n\r\n|\n\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\r\n|\n/g, "<br/>")}</p>`);

  return paragraphs.join("");
}

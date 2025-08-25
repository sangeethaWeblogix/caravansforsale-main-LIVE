// utils/date.ts
export function formatPostDate(input: string | Date): string {
  if (!input) return "";
  // Handle strings like "2025-08-15 19:53:20" (no timezone)
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}\s\d/.test(input)) {
    input = input.replace(" ", "T") + "Z"; // treat as UTC
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

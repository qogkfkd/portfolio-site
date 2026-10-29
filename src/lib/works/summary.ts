import type { Work } from "../types";

export const SUMMARY_MAX = 120;

const SCRIPT_OR_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const BLOCK_TAG = /<\/?(?:p|div|br|hr|li|ul|ol|h[1-6]|blockquote|pre|section|article|table|tr|td|th)\b[^>]*>/gi;
const ANY_TAG = /<[^>]*>/g;
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

export function stripHtml(html: string): string {
  return html
    .replace(SCRIPT_OR_STYLE, " ")
    .replace(BLOCK_TAG, " ")
    .replace(ANY_TAG, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

export function summaryOf(work: Pick<Work, "summary" | "descriptionHtml">): string {
  const summary = work.summary?.trim() ?? "";
  if (summary !== "") return summary;
  return Array.from(stripHtml(work.descriptionHtml)).slice(0, SUMMARY_MAX).join("");
}

/**
 * Strip Markdown markers to readable plain text for meta / JSON-LD.
 * Deterministic, DOM-free; covers CommonMark + common GFM used in event descriptions.
 */
export function markdownToPlainText(markdown: string): string {
  if (!markdown) {
    return "";
  }

  let text = markdown.replace(/\r\n?/g, "\n");

  // Fenced code blocks → inner content
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, "$1");
  // ATX headings
  text = text.replace(/^#{1,6}\s+/gm, "");
  // Images → alt text
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  // Links → label
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Autolink-style bare URLs kept as-is; angle autolinks
  text = text.replace(/<((?:https?:\/\/|mailto:)[^>]+)>/gi, "$1");
  // Bold / italic / strikethrough (order: longer markers first)
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/~~(.*?)~~/g, "$1");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  // Inline code
  text = text.replace(/`([^`]+)`/g, "$1");
  // Blockquotes
  text = text.replace(/^>\s?/gm, "");
  // Task list / unordered list markers
  text = text.replace(/^\s*[-*+]\s+(?:\[[ xX]\]\s+)?/gm, "");
  // Ordered list markers
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  // Horizontal rules
  text = text.replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm, "");
  // Table row pipes → spaces (best-effort)
  text = text.replace(/\|/g, " ");
  // Table separator rows
  text = text.replace(/^\s*:?-{3,}:?\s*$/gm, "");

  return text.replace(/\s+/g, " ").trim();
}

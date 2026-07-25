import { Code, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  markdown: string;
  className?: string;
};

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** Allow relative, hash, mailto, tel, and http(s). Reject javascript:/data:/etc. */
function safeHref(href: string | undefined): string | undefined {
  if (!href) {
    return undefined;
  }
  const trimmed = href.trim();
  if (!trimmed) {
    return undefined;
  }
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed) ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }
  return undefined;
}

const markdownComponents: Components = {
  p: ({ children }) => <Paragraph>{children}</Paragraph>,
  h1: ({ children }) => <Heading level={1}>{children}</Heading>,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  h4: ({ children }) => <Heading level={4}>{children}</Heading>,
  h5: ({ children }) => <Heading level={5}>{children}</Heading>,
  h6: ({ children }) => <Heading level={6}>{children}</Heading>,
  a: ({ href, children }) => {
    const safe = safeHref(href);
    if (!safe) {
      return <span>{children}</span>;
    }
    const external = isExternalHref(safe);
    return (
      <Link href={safe} {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}>
        {children}
      </Link>
    );
  },
  code: ({ children, className }) => {
    // Fenced blocks put a language-* className on the inner code element.
    if (className) {
      return <code className={className}>{children}</code>;
    }
    return <Code>{children}</Code>;
  },
};

/**
 * SSR-safe Markdown renderer (GFM). No rehype-raw — HTML in Markdown is not executed.
 * Maps text/links/headings to HeroUI; list/table/pre remain native under themed wrapper.
 */
export default function MarkdownContent({ markdown, className }: MarkdownContentProps) {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return null;
  }

  return (
    <Surface
      className={`event-description-markdown ${className ?? ""}`.trim()}
      variant="transparent"
    >
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {trimmed}
      </ReactMarkdown>
    </Surface>
  );
}

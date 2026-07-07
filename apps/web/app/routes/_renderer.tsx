import { reactRenderer } from "@hono/react-renderer";
import { Link, Script } from "honox/server";
import type { Locale } from "../lib/locale";
import { buildPageMeta } from "../lib/seo";
import { APP_STYLESHEET_HREF } from "../lib/stylesheet";

function SeoHead({
  title,
  description,
  canonicalPath,
  locale,
  ogImage,
}: {
  title?: string;
  description?: string;
  canonicalPath?: string;
  locale?: Locale;
  ogImage?: string;
}) {
  if (description && canonicalPath && locale && title) {
    const meta = buildPageMeta({
      locale,
      pathname: canonicalPath,
      title,
      description,
      ogImage,
    });

    return (
      <>
        <title>{meta.documentTitle}</title>
        <meta content={meta.description} name="description" />
        <link href={meta.canonical} rel="canonical" />
        {meta.alternates.map((alternate) => (
          <link
            href={alternate.href}
            hrefLang={alternate.hreflang}
            key={alternate.hreflang}
            rel="alternate"
          />
        ))}
        {Object.entries(meta.openGraph).map(([property, content]) => (
          <meta content={content} key={property} property={property} />
        ))}
        {Object.entries(meta.twitter).map(([name, content]) => (
          <meta content={content} key={name} name={name} />
        ))}
      </>
    );
  }

  return <title>{title ? `${title} — Unveiled Berlin` : "Unveiled Berlin"}</title>;
}

export default reactRenderer(
  ({ children, title, locale, robots, description, canonicalPath, ogImage }) => {
    return (
      <html lang={locale ?? "de"}>
        <head>
          <meta charSet="UTF-8" />
          <meta content="width=device-width, initial-scale=1.0" name="viewport" />
          {robots ? <meta content={robots} name="robots" /> : null}
          <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
          <Link href={APP_STYLESHEET_HREF} rel="stylesheet" />
          <Script src="/app/client.ts" />
          <SeoHead
            canonicalPath={canonicalPath}
            description={description}
            locale={locale}
            ogImage={ogImage}
            title={title}
          />
        </head>
        <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-foreground selection:text-accent">
          {children}
        </body>
      </html>
    );
  },
);

import { reactRenderer } from "@hono/react-renderer";
import { Link, Script } from "honox/server";

import "../styles/globals.css";

export default reactRenderer(({ children, title, locale, robots }) => {
  return (
    <html lang={locale ?? "de"}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {robots ? <meta content={robots} name="robots" /> : null}
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <Link href="/app/styles/globals.css" rel="stylesheet" />
        <Script src="/app/client.ts" />
        {title ? <title>{title}</title> : <title>Unveiled Berlin</title>}
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-foreground selection:text-accent">
        {children}
      </body>
    </html>
  );
});

import { reactRenderer } from "@hono/react-renderer";
import { Link } from "honox/server";

import "../styles/globals.css";

export default reactRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Link href="/app/styles/globals.css" rel="stylesheet" />
        {title ? <title>{title}</title> : <title>Unveiled Berlin</title>}
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-foreground selection:text-accent">
        {children}
      </body>
    </html>
  );
});

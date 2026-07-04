import type { NotFoundHandler } from "hono";

import { NotFoundPage } from "../components/NotFoundPage";

const handler: NotFoundHandler = (c) => {
  c.status(404);
  c.header("X-Robots-Tag", "noindex");

  return c.render(<NotFoundPage locale="de" />, {
    locale: "de",
    robots: "noindex",
    title: "Not Found — Unveiled Berlin",
  });
};

export default handler;

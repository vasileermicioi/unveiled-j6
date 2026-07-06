import { createRoute } from "honox/factory";

import { buildRobotsTxt } from "../lib/robots-config";

export default createRoute((c) => {
  return c.text(buildRobotsTxt(), 200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
});

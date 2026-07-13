import type { ErrorHandler } from "hono";

import { serverErrorHandler } from "../lib/error-response";

const handler: ErrorHandler = (err, c) => serverErrorHandler(err, c);

export default handler;

import type { Context } from "hono";

import { getEnvVar } from "./runtime-env";

const FORWARD_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
] as const;

function getAuthBaseUrl(): string | null {
  const authUrl = getEnvVar("AUTH_URL");
  if (!authUrl) {
    return null;
  }
  return authUrl.replace(/\/$/, "");
}

function buildTargetUrl(authBaseUrl: string, request: Request): string {
  const requestUrl = new URL(request.url);
  const suffix = requestUrl.pathname.replace(/^\/api\/auth\/?/, "");
  const query = requestUrl.search;
  return suffix ? `${authBaseUrl}/${suffix}${query}` : `${authBaseUrl}${query}`;
}

export async function authProxyHandler(c: Context) {
  const authBaseUrl = getAuthBaseUrl();
  if (!authBaseUrl) {
    return c.text("AUTH_URL is not configured", 503);
  }

  const targetUrl = buildTargetUrl(authBaseUrl, c.req.raw);

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = c.req.header(name);
    if (value) {
      headers.set(name, value);
    }
  }

  const method = c.req.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await c.req.raw.clone().arrayBuffer();

  const upstream = await fetch(targetUrl, {
    body,
    headers,
    method,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    responseHeaders.append(key, value);
  });

  return new Response(upstream.body, {
    headers: responseHeaders,
    status: upstream.status,
  });
}

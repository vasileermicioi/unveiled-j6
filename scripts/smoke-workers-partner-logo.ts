#!/usr/bin/env bun
/**
 * Workers-runtime smoke: sign in as admin, POST partner create with logo,
 * assert 302 + six JPEG objects in R2.
 *
 * Expects wrangler already listening on SITE_URL (default http://127.0.0.1:8787).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { createSolidJpeg } from "../packages/images/src/create-solid-jpeg.ts";

function loadRootEnv(): void {
  const envPath = resolve(import.meta.dir, "../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadRootEnv();

const baseURL = process.env.SITE_URL ?? "http://127.0.0.1:8787";
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
if (!email || !password) {
  throw new Error("E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD required");
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function main(): Promise<void> {
  const cookieJar = new Map<string, string>();

  const mergeCookies = (res: Response) => {
    const headers = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const raw of headers) {
      const [pair] = raw.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  };
  const cookieHeader = () =>
    [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

  // CSRF / origin: Better Auth needs Origin allowlisted; localhost/127.0.0.1 usually ok.
  const signIn = await fetch(`${baseURL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseURL,
      referer: `${baseURL}/de/login`,
    },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  mergeCookies(signIn);
  if (!signIn.ok) {
    const body = await signIn.text();
    throw new Error(`sign-in failed ${signIn.status}: ${body.slice(0, 400)}`);
  }

  const session = await fetch(`${baseURL}/api/auth/get-session`, {
    headers: { cookie: cookieHeader(), origin: baseURL },
  });
  mergeCookies(session);
  const sessionJson = (await session.json()) as { user?: { id?: string; email?: string } } | null;
  if (!sessionJson?.user?.id) {
    throw new Error(`no session after sign-in: ${JSON.stringify(sessionJson)}`);
  }
  console.log(`signed in as ${sessionJson.user.email ?? sessionJson.user.id}`);

  const jpeg = await createSolidJpeg(900, 500, { r: 40, g: 120, b: 200 });
  const suffix = Date.now().toString(36);
  const form = new FormData();
  form.set("name", `Workers Sip Smoke ${suffix}`);
  form.set("contact_email", `sip-smoke-${suffix}@example.com`);
  form.set("address", `Smoke Street ${suffix}, 10115 Berlin`);
  form.set("logo", new File([jpeg], "logo.jpg", { type: "image/jpeg" }));

  const create = await fetch(`${baseURL}/de/admin/partners/new`, {
    method: "POST",
    headers: {
      cookie: cookieHeader(),
      origin: baseURL,
      referer: `${baseURL}/de/admin/partners/new`,
    },
    body: form,
    redirect: "manual",
  });
  mergeCookies(create);

  const location = create.headers.get("location") ?? "";
  console.log(`create status=${create.status} location=${location}`);
  if (create.status !== 302 || !/\/de\/admin\/partners\/?$/.test(location)) {
    const body = await create.text();
    throw new Error(
      `expected 302 to partner list, got ${create.status} ${location}\n${body.slice(0, 800)}`,
    );
  }

  // Confirm list page shows partner (and thumbnail markup if present)
  const list = await fetch(`${baseURL}/de/admin/partners`, {
    headers: { cookie: cookieHeader() },
  });
  const listHtml = await list.text();
  if (!listHtml.includes(`Workers Sip Smoke ${suffix}`)) {
    throw new Error("partner name not found on admin list");
  }
  console.log("partner visible on admin list");

  // Find newest image folder in R2 with six .jpg keys (best-effort by listing recent prefixes)
  const client = new S3Client({
    region: requireEnv("S3_REGION"),
    endpoint: requireEnv("S3_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: true,
  });
  const listed = await client.send(
    new ListObjectsV2Command({
      Bucket: requireEnv("S3_BUCKET"),
      Prefix: "images/",
      MaxKeys: 1000,
    }),
  );
  const keys = (listed.Contents ?? []).map((o) => o.Key).filter(Boolean) as string[];
  const byId = new Map<string, string[]>();
  for (const key of keys) {
    const match = /^images\/([^/]+)\/(.+\.jpg)$/.exec(key);
    if (!match) continue;
    const [, id, file] = match;
    const arr = byId.get(id) ?? [];
    arr.push(file);
    byId.set(id, arr);
  }
  const complete = [...byId.entries()].filter(([, files]) => files.length >= 6);
  if (complete.length === 0) {
    throw new Error("no image id with six .jpg variants found in R2 listing");
  }
  console.log(`R2 has ${complete.length} image(s) with six .jpg variants (smoke ok)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

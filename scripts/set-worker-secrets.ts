#!/usr/bin/env bun

/**
 * Push runtime secrets from repo-root `.env` to the Cloudflare Worker in wrangler.toml.
 *
 * Prereqs: `wrangler login` or `CLOUDFLARE_API_TOKEN` with Workers Scripts:Edit.
 *
 * Usage:
 *   bun run secrets:workers
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
const envPath = join(repoRoot, ".env");
const wranglerConfig = join(repoRoot, "apps/web/wrangler.toml");

const SECRET_KEYS = [
  "DATABASE_URL",
  "AUTH_URL",
  "SITE_URL",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "IMAGE_PUBLIC_BASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_BASIC_BERLIN",
  "RESEND_API_KEY",
  "DAILY_CODES_FROM_EMAIL",
  "SENTRY_DSN",
  "ADMIN_PROMOTE_EMAILS",
] as const;

function parseDotEnv(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value.length > 0) {
      values[key] = value;
    }
  }

  return values;
}

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}. Copy .env.example and fill in values first.`);
  process.exit(1);
}

if (!existsSync(wranglerConfig)) {
  console.error(`Missing ${wranglerConfig}`);
  process.exit(1);
}

const env = parseDotEnv(readFileSync(envPath, "utf8"));
const secrets: Record<string, string> = {};

for (const key of SECRET_KEYS) {
  const value = env[key];
  if (typeof value === "string" && value.length > 0) {
    secrets[key] = value;
  }
}

const required = ["DATABASE_URL", "AUTH_URL"] as const;
const missingRequired = required.filter((key) => !secrets[key]);
if (missingRequired.length > 0) {
  console.error(`Missing required keys in .env: ${missingRequired.join(", ")}`);
  process.exit(1);
}

const tmpDir = mkdtempSync(join(tmpdir(), "unveiled-secrets-"));
const secretsFile = join(tmpDir, "secrets.json");
writeFileSync(secretsFile, JSON.stringify(secrets, null, 2));

console.log(
  `Uploading ${Object.keys(secrets).join(", ")} to Worker (see apps/web/wrangler.toml name)...`,
);

const result = spawnSync(
  "bunx",
  ["wrangler", "secret", "bulk", secretsFile, "--config", wranglerConfig],
  { stdio: "inherit", cwd: repoRoot },
);

if (result.status !== 0) {
  console.error(
    "\nFailed. Authenticate with `bunx wrangler login` or set CLOUDFLARE_API_TOKEN, then retry.",
  );
  process.exit(result.status ?? 1);
}

console.log("\nDone. Verify runtime config:");
console.log("  curl https://unveiled-j6.deepcode.xyz/api/health/runtime");

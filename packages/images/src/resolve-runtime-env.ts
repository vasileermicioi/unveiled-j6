type RuntimeEnvStore = Record<string, string | undefined>;

export function resolveRuntimeEnv(): NodeJS.ProcessEnv {
  const runtimeEnv = (globalThis as { __UNVEILED_ENV__?: RuntimeEnvStore }).__UNVEILED_ENV__;
  if (runtimeEnv) {
    return runtimeEnv as NodeJS.ProcessEnv;
  }

  return process.env;
}

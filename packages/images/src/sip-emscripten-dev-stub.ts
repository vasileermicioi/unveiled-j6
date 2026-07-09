/** Dev/serve stub — real Emscripten factory is aliased only for Workers SSR build. */
export default async function createSipModule(): Promise<never> {
  throw new Error("sip emscripten factory is only available in the Workers build");
}

/** Dev/serve/test stub — Workers Vite aliases `@unveiled/images/sip-emscripten` to sip.js. */
export const isSipEmscriptenStub = true;

export default async function createSipModule(): Promise<never> {
  throw new Error("sip emscripten factory is only available in the Workers build");
}

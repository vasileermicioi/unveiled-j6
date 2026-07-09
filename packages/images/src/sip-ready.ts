/// <reference lib="dom" />
/// <reference path="./sip-wasm.d.ts" />

import { ready } from "@standardagents/sip";

type WasmImports = WebAssembly.Imports;
type WasmInstance = WebAssembly.Instance;

type SipEmscriptenFactory = (options: {
  instantiateWasm: (
    imports: WasmImports,
    receiveInstance: (instance: WasmInstance, module?: WebAssembly.Module) => void,
  ) => WebAssembly.Exports | Record<string, never>;
}) => Promise<unknown>;

type GlobalWithSipLoader = typeof globalThis & {
  __SIP_WASM_LOADER__?: () => Promise<unknown>;
};

/**
 * Module-level WASM init; await before any sip call. Idempotent.
 *
 * Workers build aliases `@standardagents/sip` → `workerd.js`, which statically imports
 * `sip.wasm` as a CompiledWasm module and installs `__SIP_WASM_LOADER__`. This helper
 * also installs the loader (sync `WebAssembly.Instance`) when the emscripten factory +
 * wasm module are available, so Emscripten never falls back to fetch/XHR.
 *
 * Local Vite/Bun: emscripten is stubbed and wasm import is stubbed → default `ready()`
 * uses sip's Node/Bun `fs.readFile` path.
 */
async function initSip(): Promise<void> {
  const globalScope = globalThis as GlobalWithSipLoader;

  // workerd entry may already have installed the loader via static wasm import.
  if (globalScope.__SIP_WASM_LOADER__) {
    await ready();
    return;
  }

  let createSipModule: SipEmscriptenFactory;
  try {
    createSipModule = (await import("@unveiled/sip-emscripten")).default as SipEmscriptenFactory;
  } catch {
    await ready();
    return;
  }

  let sipWasm: WebAssembly.Module;
  try {
    const loaded = (await import("@standardagents/sip/dist/sip.wasm")).default;
    // Vite serve stubs this import as `undefined` so SSR never hits ESM-Wasm.
    // Do not use `instanceof WebAssembly.Module` — it fails across workerd realms.
    if (loaded == null) {
      await ready();
      return;
    }
    sipWasm = loaded;
  } catch {
    await ready();
    return;
  }

  // Sync instantiate — Workers disallow compile-from-bytes; CompiledWasm Module is required.
  // Prefer sync Instance so Emscripten's instantiateWasm hook never falls through to fetch.
  globalScope.__SIP_WASM_LOADER__ = async () =>
    createSipModule({
      instantiateWasm(imports, receiveInstance) {
        const instance = new WebAssembly.Instance(sipWasm, imports);
        receiveInstance(instance, sipWasm);
        return instance.exports;
      },
    });

  await ready();
}

export const sipReady = initSip();

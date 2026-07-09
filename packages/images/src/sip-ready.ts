/// <reference lib="dom" />
/// <reference path="./sip-wasm.d.ts" />

import { ready } from "@standardagents/sip";

type WasmImports = WebAssembly.Imports;
type WasmInstance = WebAssembly.Instance;

type SipEmscriptenFactory = (options: {
  instantiateWasm: (
    imports: WasmImports,
    receiveInstance: (instance: WasmInstance) => void,
  ) => Record<string, never>;
}) => Promise<unknown>;

type GlobalWithSipLoader = typeof globalThis & {
  __SIP_WASM_LOADER__?: () => Promise<unknown>;
};

/**
 * Module-level WASM init; await before any sip call. Idempotent.
 *
 * Workers: Vite aliases `@unveiled/sip-emscripten` and rewrites the wasm import to a
 * sibling CompiledWasm module. Install `__SIP_WASM_LOADER__` (sip workerd pattern)
 * so `nodejs_compat` does not take sip's `fs.readFile` path.
 *
 * Vite SSR / Bun / Node: emscripten alias is absent (or wasm load fails) → default `ready()`.
 * Wasm must not be a static top-level import — Vite serve rejects ESM Wasm integration.
 */
async function initSip(): Promise<void> {
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

  const globalScope = globalThis as GlobalWithSipLoader;
  globalScope.__SIP_WASM_LOADER__ = async () =>
    createSipModule({
      instantiateWasm(imports, receiveInstance) {
        void WebAssembly.instantiate(sipWasm, imports).then(
          (result: WasmInstance | WebAssembly.WebAssemblyInstantiatedSource) => {
            receiveInstance(result instanceof WebAssembly.Instance ? result : result.instance);
          },
        );
        return {};
      },
    });

  await ready();
}

export const sipReady = initSip();

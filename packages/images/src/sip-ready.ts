/// <reference lib="dom" />
/// <reference path="./sip-wasm.d.ts" />

// Package export defaults to the empty stub; Workers Vite build aliases
// `@unveiled/images/sip-workers-init` → sip-workers-init.ts (CompiledWasm loaders).
import "@unveiled/images/sip-workers-init";

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
 * Workers: `@unveiled/sip-workers-init` installs sync `__SIP_WASM_LOADER__` +
 * `__SIP_CODEC_WASM__` (jsquash WebP/AVIF) before `ready()`.
 *
 * Local Vite/Bun: workers-init is stubbed → default `ready()` uses sip's Node path.
 */
async function initSip(): Promise<void> {
  const globalScope = globalThis as GlobalWithSipLoader;

  if (globalScope.__SIP_WASM_LOADER__) {
    await ready();
    return;
  }

  // Fallback for Workers builds if the side-effect import was tree-shaken oddly.
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
    if (loaded == null) {
      await ready();
      return;
    }
    sipWasm = loaded;
  } catch {
    await ready();
    return;
  }

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

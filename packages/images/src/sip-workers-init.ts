/// <reference path="./sip-wasm.d.ts" />

import avifDecWasm from "@jsquash/avif/codec/dec/avif_dec.wasm";
import webpDecWasm from "@jsquash/webp/codec/dec/webp_dec.wasm";
import sipWasm from "@standardagents/sip/dist/sip.wasm";
/**
 * Workers-only side-effect module: install sip + jsquash codec WASM loaders before
 * `ready()`. Uses sync `WebAssembly.Instance` on CompiledWasm modules so Emscripten
 * never falls through to fetch/XHR ("both async and sync fetching of the wasm failed").
 */
import createSipModule from "@unveiled/images/sip-emscripten";

type GlobalWithSip = typeof globalThis & {
  __SIP_WASM_LOADER__?: () => Promise<unknown>;
  __SIP_CODEC_WASM__?: {
    webp?: WebAssembly.Module;
    avif?: WebAssembly.Module;
  };
};

const globalScope = globalThis as GlobalWithSip;

// jsquash codecs (WebP/AVIF input) — sip reads these instead of fetching codec wasm.
globalScope.__SIP_CODEC_WASM__ = {
  webp: webpDecWasm,
  avif: avifDecWasm,
};

// Overwrite sip's shipped workerd async loader if it ran first.
globalScope.__SIP_WASM_LOADER__ = async () =>
  createSipModule({
    instantiateWasm(imports, receiveInstance) {
      const instance = new WebAssembly.Instance(sipWasm, imports);
      receiveInstance(instance, sipWasm);
      return instance.exports;
    },
  });

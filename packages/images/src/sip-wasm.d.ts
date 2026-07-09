declare module "@unveiled/sip-emscripten" {
  type SipEmscriptenFactory = (options: {
    instantiateWasm: (
      imports: WebAssembly.Imports,
      receiveInstance: (instance: WebAssembly.Instance, module?: WebAssembly.Module) => void,
    ) => WebAssembly.Exports | Record<string, never>;
  }) => Promise<unknown>;

  const createSipModule: SipEmscriptenFactory;
  export default createSipModule;
}

declare module "@standardagents/sip/dist/sip.wasm" {
  const wasm: WebAssembly.Module;
  export default wasm;
}

declare module "@jsquash/webp/codec/dec/webp_dec.wasm" {
  const wasm: WebAssembly.Module;
  export default wasm;
}

declare module "@jsquash/avif/codec/dec/avif_dec.wasm" {
  const wasm: WebAssembly.Module;
  export default wasm;
}

declare module "@unveiled/images/sip-workers-init" {}

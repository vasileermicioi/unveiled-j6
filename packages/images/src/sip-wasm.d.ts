declare module "@unveiled/sip-emscripten" {
  type SipEmscriptenFactory = (options: {
    instantiateWasm: (
      imports: WebAssembly.Imports,
      receiveInstance: (instance: WebAssembly.Instance) => void,
    ) => Record<string, never>;
  }) => Promise<unknown>;

  const createSipModule: SipEmscriptenFactory;
  export default createSipModule;
}

declare module "@standardagents/sip/dist/sip.wasm" {
  const wasm: WebAssembly.Module;
  export default wasm;
}

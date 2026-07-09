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

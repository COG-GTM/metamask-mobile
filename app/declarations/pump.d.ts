declare module 'pump' {
  type PumpStream = NodeJS.ReadableStream | NodeJS.WritableStream;

  type PumpCallback = (error?: Error | null) => void;

  function pump(...streams: (PumpStream | PumpCallback)[]): PumpStream;

  export = pump;
}

declare module 'pump' {
  type PumpStream =
    | NodeJS.ReadableStream
    | NodeJS.WritableStream
    | import('stream').Stream;

  type PumpCallback = (error?: Error | null) => void;

  function pump(...streams: (PumpStream | PumpCallback)[]): PumpStream;

  export = pump;
}

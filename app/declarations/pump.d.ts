declare module 'pump' {
  type Stream = import('stream').Stream;

  type PumpCallback = (error?: Error | null) => void;

  function pump(...streams: (Stream | PumpCallback)[]): Stream;

  export default pump;
}

declare module 'pump' {
  // eslint-disable-next-line import/no-nodejs-modules
  import type { Stream } from 'stream';

  type PumpCallback = (error?: Error | null) => void;

  function pump(...streams: (Stream | PumpCallback)[]): Stream;

  export default pump;
}

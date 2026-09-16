declare module 'readable-stream' {
  export { Duplex, Readable, Stream, Transform, Writable } from 'stream';
}

declare module 'pump' {
  import { Stream } from 'stream';

  namespace pump {
    type Callback = (err?: Error) => void;
  }

  function pump(
    stream1: Stream,
    stream2: Stream,
    ...streams: (Stream | pump.Callback)[]
  ): Stream;

  export = pump;
}

declare namespace NodeJS {
  interface ProcessEnv {
    METAMASK_BUILD_NAME: string;
    METAMASK_BUILD_ICON: string;
    METAMASK_BUILD_APP_ID: string;
  }
}

interface Window {
  ReactNativeWebView: { postMessage(message: string): void };
  _metamaskSetupProvider: () => void;
  ethereum: import('@metamask/providers').MetaMaskInpageProvider;
}

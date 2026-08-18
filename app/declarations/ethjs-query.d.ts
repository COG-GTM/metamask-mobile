declare module '@metamask/ethjs-query' {
  interface Provider {
    sendAsync: (...args: unknown[]) => void;
  }

  export default class Eth {
    constructor(provider: Provider);
  }
}

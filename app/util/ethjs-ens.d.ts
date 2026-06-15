declare module 'ethjs-ens' {
  interface ENSOptions {
    provider?: unknown;
    network?: string | number;
    registryAddress?: string;
  }

  export default class ENS {
    constructor(options: ENSOptions);
    lookup(name: string): Promise<string>;
    reverse(address: string): Promise<string>;
  }
}

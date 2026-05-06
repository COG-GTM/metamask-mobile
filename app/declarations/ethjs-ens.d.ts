declare module 'ethjs-ens' {
  interface EnsOptions {
    provider?: unknown;
    network?: string;
    registryAddress?: string;
  }

  class Ens {
    constructor(opts?: EnsOptions);
    lookup(name: string): Promise<string>;
    reverse(address: string): Promise<string>;
    getNamehash(name: string): string;
  }

  export default Ens;
}

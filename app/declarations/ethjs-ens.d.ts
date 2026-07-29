declare module 'ethjs-ens' {
  interface EnsOptions {
    provider: unknown;
    network?: string;
    registryAddress?: string;
  }

  export default class Ens {
    constructor(options: EnsOptions);
    lookup(name: string): Promise<string>;
    reverse(address: string): Promise<string>;
    getNamehash(name: string): string;
    getResolverAddress(node: string): Promise<string>;
  }
}

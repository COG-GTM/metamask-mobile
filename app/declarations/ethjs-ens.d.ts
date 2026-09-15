declare module 'ethjs-ens' {
  interface ENSOptions {
    provider: unknown;
    network: string | number;
    registryAddress?: string;
  }

  class ENS {
    constructor(opts: ENSOptions);
    lookup(name: string): Promise<string>;
    reverse(address: string): Promise<string>;
    getNamehash(name: string): string;
    getOwner(name: string): Promise<string>;
    getResolverForNode(node: string): Promise<string>;
  }

  export = ENS;
}

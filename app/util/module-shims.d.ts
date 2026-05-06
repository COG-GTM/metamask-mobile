declare module 'ethjs-ens' {
  interface ENSOptions {
    provider: unknown;
    network?: unknown;
    registryAddress?: string;
  }

  class ENS {
    constructor(options: ENSOptions);
    lookup(ensName: string): Promise<string>;
    reverse(address: string): Promise<string>;
    resolveAddressForNode(node: string): Promise<string>;
  }

  export default ENS;
}

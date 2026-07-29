declare module 'eth-ens-namehash' {
  const namehash: {
    hash(name: string): string;
    normalize(name: string): string;
  };
  export default namehash;
}

declare module '@metamask/ethjs-query' {
  interface EthQueryConstructor {
    new (provider: unknown): object;
  }
  const Eth: EthQueryConstructor;
  export default Eth;
}

declare module '@metamask/ethjs-contract' {
  /**
   * A deployed contract. Method names come from the ABI the contract was built
   * with, and every call resolves with the list of the method's return values.
   */
  interface ContractInstance {
    [method: string]: (...args: unknown[]) => Promise<unknown[]>;
  }

  interface ContractBuilder {
    at(address: string): ContractInstance;
  }

  interface EthContractConstructor {
    new (eth: object): (abi: unknown[]) => ContractBuilder;
  }

  const EthContract: EthContractConstructor;
  export default EthContract;
}

declare module 'content-hash' {
  const contentHash: {
    decode(contentHash: string): string;
    getCodec(contentHash: string): string;
    encode(codec: string, value: string): string;
  };
  export default contentHash;
}

declare module 'multihashes' {
  const multihash: {
    fromHexString(hex: string): Uint8Array;
    toB58String(hash: Uint8Array): string;
    encode(buffer: Uint8Array, code: string | number): Uint8Array;
  };
  export default multihash;
}

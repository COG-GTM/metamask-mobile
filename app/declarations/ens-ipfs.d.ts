// Type declarations for the untyped packages used by app/lib/ens-ipfs.
declare module 'eth-ens-namehash' {
  const namehash: {
    hash(name: string): string;
    normalize(name: string): string;
  };
  export default namehash;
}

declare module '@metamask/ethjs-query' {
  export default class Eth {
    constructor(
      provider: unknown,
      options?: { debug?: boolean; logger?: unknown; jsonSpace?: number },
    );
  }
}

declare module '@metamask/ethjs-contract' {
  import type { JsonFragment } from '@ethersproject/abi';
  import type Eth from '@metamask/ethjs-query';

  export type ContractMethod = <T extends unknown[] = unknown[]>(
    ...args: unknown[]
  ) => Promise<T>;

  export type ContractInstance = Record<string, ContractMethod>;

  export interface ContractFactory {
    at(address: string): ContractInstance;
    new (...args: unknown[]): Promise<string>;
  }

  export type ContractFactoryBuilder = (
    contractABI: readonly JsonFragment[],
    contractBytecode?: string,
    contractDefaultTxObject?: Record<string, unknown>,
  ) => ContractFactory;

  const EthContract: {
    new (query: Eth): ContractFactoryBuilder;
    (query: Eth): ContractFactoryBuilder;
  };
  export default EthContract;
}

declare module 'content-hash' {
  const contentHash: {
    decode(contentHash: string): string;
    getCodec(contentHash: string): string;
    encode(codec: string, value: string): string;
    fromIpfs(ipfsHash: string): string;
    fromSwarm(swarmHash: string): string;
  };
  export default contentHash;
}

declare module 'multihashes' {
  const multihash: {
    fromHexString(hash: string): Uint8Array;
    toHexString(hash: Uint8Array): string;
    fromB58String(hash: string): Uint8Array;
    toB58String(hash: Uint8Array): string;
    encode(
      digest: Uint8Array,
      code: string | number,
      length?: number,
    ): Uint8Array;
    decode(buf: Uint8Array): {
      code: number;
      name: string;
      length: number;
      digest: Uint8Array;
    };
  };
  export default multihash;
}

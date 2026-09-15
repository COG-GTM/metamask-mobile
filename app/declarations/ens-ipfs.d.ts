// Minimal ambient declarations for the untyped libraries used by
// app/lib/ens-ipfs/resolver.ts.

declare module 'eth-ens-namehash' {
  const namehash: {
    hash: (name: string) => string;
    normalize: (name: string) => string;
  };
  export default namehash;
}

declare module '@metamask/ethjs-query' {
  export default class Eth {
    constructor(provider: unknown, options?: Record<string, unknown>);
  }
}

declare module '@metamask/ethjs-contract' {
  import type Eth from '@metamask/ethjs-query';
  import type { JsonFragment } from '@ethersproject/abi';

  export type EthContractCallResult = unknown[] & Record<string, unknown>;

  export interface EthContractInstance {
    [method: string]: (...args: unknown[]) => Promise<EthContractCallResult>;
  }

  export interface EthContractFactory {
    at: (address: string) => EthContractInstance;
    new: (...args: unknown[]) => Promise<string>;
  }

  export type EthContract = (
    abi: readonly JsonFragment[],
    bytecode?: string,
    defaultTxObject?: Record<string, unknown>,
  ) => EthContractFactory;

  interface EthContractConstructor {
    (query: Eth): EthContract;
    new (query: Eth): EthContract;
  }
  const contract: EthContractConstructor;
  export default contract;
}

declare module 'content-hash' {
  export function decode(contentHash: string): string;
  export function encode(codec: string, value: string): string;
  export function getCodec(contentHash: string): string;
}

declare module 'multihashes' {
  export type HashName = string;
  export function fromHexString(hash: string): Uint8Array;
  export function toHexString(hash: Uint8Array): string;
  export function fromB58String(hash: string | Uint8Array): Uint8Array;
  export function toB58String(hash: Uint8Array): string;
  export function encode(
    digest: Uint8Array,
    code: HashName | number,
    length?: number,
  ): Uint8Array;
  export function decode(buf: Uint8Array): {
    code: number;
    name: HashName;
    length: number;
    digest: Uint8Array;
  };
}

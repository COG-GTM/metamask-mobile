/**
 * Minimal ambient declarations for the untyped JavaScript packages used by the
 * ENS/IPFS resolver. Only the members used by this module are declared.
 */

declare module 'eth-ens-namehash' {
  export function hash(name: string): string;
  export function normalize(name: string): string;
}

declare module '@metamask/ethjs-query' {
  export default class Eth {
    constructor(provider: unknown);
  }
}

declare module '@metamask/ethjs-contract' {
  type ContractInstance = Record<
    string,
    (...args: unknown[]) => Promise<unknown[]>
  >;

  type ContractFactory = (abi: unknown) => {
    at(address: string): ContractInstance;
  };

  const EthContract: new (eth: unknown) => ContractFactory;
  export default EthContract;
}

declare module 'content-hash' {
  export function decode(contentHash: string): string;
  export function getCodec(contentHash: string): string;
  export function encode(codec: string, value: string): string;
}

declare module 'multihashes' {
  export function fromHexString(hex: string): Uint8Array;
  export function toB58String(hash: Uint8Array): string;
  export function encode(buffer: Uint8Array, code: string): Uint8Array;
}

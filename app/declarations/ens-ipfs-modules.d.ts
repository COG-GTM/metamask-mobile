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
  type ContractMethod = (...args: unknown[]) => Promise<Record<number, string>>;
  type Contract = Record<string, ContractMethod>;
  interface ContractFactory {
    at(address: string): Contract;
  }
  type EthContractFactory = (abi: readonly unknown[]) => ContractFactory;
  const EthContract: new (eth: unknown) => EthContractFactory;
  export default EthContract;
}

declare module 'content-hash' {
  export function decode(contentHash: string): string;
  export function getCodec(contentHash: string): string;
}

declare module 'multihashes' {
  export function fromHexString(hex: string): Uint8Array;
  export function toB58String(hash: Uint8Array): string;
  export function encode(digest: Uint8Array, code: string | number): Uint8Array;
}

declare module 'human-standard-token-abi' {
  const abi: Record<string, unknown>[];
  export default abi;
}

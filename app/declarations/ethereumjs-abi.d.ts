declare module 'ethereumjs-abi' {
  export function rawEncode(types: string[], values: unknown[]): Buffer;
  export function rawDecode<T = unknown>(
    types: string[],
    data: Buffer | Uint8Array,
  ): T[];
}

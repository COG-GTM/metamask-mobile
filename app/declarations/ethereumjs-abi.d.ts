declare module 'ethereumjs-abi' {
  export function rawEncode(types: string[], values: unknown[]): Buffer;
  export function rawDecode(types: string[], data: Buffer): unknown[];
  export function methodID(name: string, types: string[]): Buffer;
  export function simpleEncode(method: string, ...args: unknown[]): Buffer;
  export function simpleDecode(method: string, data: Buffer): unknown[];
  export function stringify(types: string[], values: unknown[]): string;
  export function soliditySHA3(types: string[], values: unknown[]): Buffer;
  export function soliditySHA256(types: string[], values: unknown[]): Buffer;
  export function solidityRIPEMD160(types: string[], values: unknown[]): Buffer;
}

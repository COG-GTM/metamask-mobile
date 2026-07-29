// `ethereumjs-abi` is published without type declarations, so the small part
// of its public surface used by the app is declared here.
declare module 'ethereumjs-abi' {
  export function rawEncode(types: string[], values: unknown[]): Buffer;
  export function rawDecode(types: string[], data: Buffer): string[];
}

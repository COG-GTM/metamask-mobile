// Ambient module declarations for third-party packages that ship without
// TypeScript types and are consumed by app/util/transactions/index.ts.
//
// These are intentionally narrow and only declare the surface actually used
// by this module — broader project-wide declarations belong in
// `app/declarations/index.d.ts`.

declare module 'ethereumjs-abi' {
  export function rawEncode(types: string[], values: unknown[]): Buffer;
  export function rawDecode(types: string[], data: Buffer): unknown[];
}

declare module 'humanize-duration' {
  interface HumanizerOptions {
    language?: string;
    fallbacks?: string[];
    delimiter?: string;
    spacer?: string;
    units?: string[];
    largest?: number;
    round?: boolean;
    decimal?: string;
    conjunction?: string;
    serialComma?: boolean;
  }

  function humanizeDuration(
    ms: number,
    options?: HumanizerOptions,
  ): string;

  export default humanizeDuration;
}

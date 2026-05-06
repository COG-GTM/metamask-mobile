declare module 'ethereumjs-abi' {
  export function rawEncode(types: string[], values: unknown[]): Buffer;
  export function rawDecode(types: string[], data: Buffer): unknown[];
}

declare module 'humanize-duration' {
  interface HumanizeDurationOptions {
    language?: string;
    fallbacks?: string[];
    units?: string[];
    delimiter?: string;
    spacer?: string;
    largest?: number;
    decimal?: string;
    conjunction?: string;
    serialComma?: boolean;
    digitReplacements?: string[];
    round?: boolean;
    unitMeasures?: Record<string, number>;
  }
  function humanizeDuration(ms: number, options?: HumanizeDurationOptions): string;
  export default humanizeDuration;
}

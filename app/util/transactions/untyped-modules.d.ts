declare module 'ethereumjs-abi' {
  export function rawEncode(types: string[], values: unknown[]): Buffer;
  export function rawDecode(types: string[], data: Buffer): string[];
}

declare module 'humanize-duration' {
  interface HumanizeDurationOptions {
    language?: string;
    languages?: Record<string, unknown>;
    fallbacks?: string[];
    delimiter?: string;
    spacer?: string;
    largest?: number;
    units?: string[];
    round?: boolean;
    decimal?: string;
    conjunction?: string;
    serialComma?: boolean;
    maxDecimalPoints?: number;
    unitMeasures?: Record<string, number>;
  }

  function humanizeDuration(
    milliseconds: number,
    options?: HumanizeDurationOptions,
  ): string;

  export default humanizeDuration;
}

declare module 'humanize-duration' {
  export interface HumanizeDurationOptions {
    language?: string;
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

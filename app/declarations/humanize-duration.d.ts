declare module 'humanize-duration' {
  interface HumanizerOptions {
    language?: string;
    fallbacks?: string[];
    delimiter?: string;
    spacer?: string;
    largest?: number;
    units?: string[];
    round?: boolean;
    decimal?: string;
    conjunction?: string;
    maxDecimalPoints?: number;
    serialComma?: boolean;
  }

  function humanizeDuration(ms: number, options?: HumanizerOptions): string;

  export default humanizeDuration;
}

// `humanize-duration` is published without type declarations, so the small
// part of its public surface used by the app is declared here.
declare module 'humanize-duration' {
  interface HumanizeDurationOptions {
    language?: string;
    fallbacks?: string[];
    delimiter?: string;
    largest?: number;
    round?: boolean;
    units?: string[];
  }

  const humanizeDuration: (
    milliseconds: number,
    options?: HumanizeDurationOptions,
  ) => string;
  export default humanizeDuration;
}

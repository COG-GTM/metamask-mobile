declare module 'unicode-confusables' {
  export interface ConfusableEntry {
    point: string;
    similarTo?: string;
  }
  export function confusables(input: string): ConfusableEntry[];
}

declare module 'unicode-confusables/data/confusables.json' {
  const data: Record<string, string>;
  export default data;
}

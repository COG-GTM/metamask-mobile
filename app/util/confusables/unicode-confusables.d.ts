declare module 'unicode-confusables' {
  export interface ConfusableEntry {
    point: string;
    similarTo?: string;
  }

  export function confusables(input: string): ConfusableEntry[];
}

declare module 'zxcvbn' {
  export interface ZXCVBNFeedback {
    warning: string;
    suggestions: string[];
  }

  export interface ZXCVBNResult {
    guesses: number;
    guesses_log10: number;
    crack_times_seconds: Record<string, number>;
    crack_times_display: Record<string, string>;
    score: 0 | 1 | 2 | 3 | 4;
    feedback: ZXCVBNFeedback;
    calc_time: number;
  }

  export default function zxcvbn(
    password: string,
    userInputs?: string[],
  ): ZXCVBNResult;
}

declare module 'zxcvbn' {
  interface ZxcvbnResult {
    score: number;
    guesses: number;
    guesses_log10: number;
    password: string;
  }

  const zxcvbn: (password: string, userInputs?: string[]) => ZxcvbnResult;

  export default zxcvbn;
}

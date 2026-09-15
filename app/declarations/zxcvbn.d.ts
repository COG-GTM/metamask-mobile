declare module 'zxcvbn' {
  interface ZxcvbnResult {
    score: number;
  }

  const zxcvbn: (password: string) => ZxcvbnResult;

  export default zxcvbn;
}

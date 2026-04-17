import type { RegexTypes } from './index.types';

describe('RegexTypes', () => {
  it('has expected interface shape', () => {
    const mockRegex: Partial<RegexTypes> = {
      accountBalance: /test/,
      activationKey: /test/,
      addressWithSpaces: /test/,
      colorBlack: /test/,
      decimalString: /test/,
      defaultAccount: /test/,
      ensName: /test/,
      fractions: /test/,
      hasOneDigit: /test/,
      hexPrefix: /test/,
      integer: /test/,
      localNetwork: /test/,
      nameInitial: /test/,
      nonNumber: /test/,
      number: /test/,
      prefixedFormattedHexString: /test/,
      privateCredentials: /test/,
      protocol: /test/,
      seedPhrase: /test/,
      startUrl: /test/,
      trailingSlash: /test/,
      trailingZero: /test/,
      transactionNonce: /test/,
      url: /test/,
      validChainId: /test/,
      validChainIdHex: /test/,
      walletAddress: /test/,
      whiteSpaces: /test/,
    };
    expect(mockRegex.accountBalance).toBeInstanceOf(RegExp);
  });

  it('eth function returns RegExp', () => {
    const mockRegex: Partial<RegexTypes> = {
      eth: (num: number) => new RegExp(`^\\d+\\.\\d{0,${num}}$`),
    };
    expect(mockRegex.eth?.(4)).toBeInstanceOf(RegExp);
  });

  it('usd function returns RegExp', () => {
    const mockRegex: Partial<RegexTypes> = {
      usd: (num: number) => new RegExp(`^\\d+\\.\\d{0,${num}}$`),
    };
    expect(mockRegex.usd?.(2)).toBeInstanceOf(RegExp);
  });

  it('exec function returns match result', () => {
    const mockRegex: Partial<RegexTypes> = {
      exec: (exp: string, input: string) => new RegExp(exp).exec(input),
    };
    const result = mockRegex.exec?.('hello', 'hello world');
    expect(result).not.toBeNull();
  });
});

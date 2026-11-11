import parseEthereumUrl, {
  MAX_ETHEREUM_URL_LENGTH,
  isValidEthereumUrl,
} from '.';

const ADDRESS = '0x8a63B1C0a3Ef13A4bA2b0e0B6CFbc5cE1D6eD5E2';

describe('parseEthereumUrl', () => {
  it.each([
    `ethereum:${ADDRESS}`,
    `ethereum:${ADDRESS}@1`,
    `ethereum:${ADDRESS}@0x5`,
    `ethereum:pay-${ADDRESS}@1?value=1e18`,
    `ethereum:${ADDRESS}@137/transfer?address=${ADDRESS}&uint256=1`,
    `ethereum:${ADDRESS}/approve?address=${ADDRESS}&uint256=1`,
    'ethereum:pay-vitalik.eth@1?value=1',
    'ethereum:pay-my-wallet.sub.eth',
  ])('accepts %s', (url) => {
    expect(isValidEthereumUrl(url)).toBe(true);
    expect(() => parseEthereumUrl(url)).not.toThrow();
  });

  it('returns the eth-url-parser output', () => {
    expect(
      parseEthereumUrl(
        `ethereum:pay-${ADDRESS}@1/transfer?address=${ADDRESS}&uint256=2`,
      ),
    ).toStrictEqual({
      scheme: 'ethereum',
      prefix: 'pay',
      target_address: ADDRESS,
      chain_id: '1',
      function_name: 'transfer',
      parameters: { address: ADDRESS, uint256: '2' },
    });
  });

  it.each([
    ['regex-injection prefix', `ethereum:(.+)+!-0x${'~'.repeat(40)}`],
    [
      'regex-injection prefix anchored with $',
      `ethereum:(.+)+$-${'a'.repeat(40)}`,
    ],
    [
      'regex-injection prefix (ENS branch)',
      `ethereum:(a|a)+$-${'a'.repeat(40)}`,
    ],
    ['prefix with regex metacharacters', `ethereum:p.y-${ADDRESS}`],
    ['non-hex address', `ethereum:0x${'z'.repeat(40)}`],
    ['short address', 'ethereum:0x1234'],
    ['trailing garbage', `ethereum:${ADDRESS};alert(1)`],
    ['whitespace', `ethereum:${ADDRESS} @1`],
    ['other scheme', `https://metamask.app.link/send/${ADDRESS}`],
    ['empty', ''],
    [
      'oversized',
      `ethereum:${ADDRESS}?data=${'a'.repeat(MAX_ETHEREUM_URL_LENGTH)}`,
    ],
  ])('rejects %s quickly', (_, url) => {
    const start = Date.now();
    expect(isValidEthereumUrl(url)).toBe(false);
    expect(() => parseEthereumUrl(url)).toThrow('Invalid Ethereum URL');
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('rejects non-string input', () => {
    expect(isValidEthereumUrl(undefined)).toBe(false);
    expect(isValidEthereumUrl(123)).toBe(false);
  });
});

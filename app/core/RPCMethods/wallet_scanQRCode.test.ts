import {
  buildScanQRCodeMatcher,
  getScanQRCodeError,
  getScanQRCodeResult,
  MAX_SCAN_QR_CODE_PATTERN_LENGTH,
  SCAN_QR_CODE_USER_CANCELLED,
  SCAN_QR_CODE_WALLET_ONLY_CONTENT,
} from './wallet_scanQRCode';

const MNEMONIC =
  'verb middle giant soon wage common wide tool gentle garlic issue nut';
const PRIVATE_KEY =
  '4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318';
const ADDRESS = '0x29c76e6ad8f28bb1004902578fb108c507be341b';

describe('buildScanQRCodeMatcher', () => {
  it('returns undefined when no pattern is provided', () => {
    expect(buildScanQRCodeMatcher(undefined)).toBeUndefined();
    expect(buildScanQRCodeMatcher(null)).toBeUndefined();
  });

  it('compiles a string pattern', () => {
    expect(buildScanQRCodeMatcher('^0x')?.test(ADDRESS)).toBe(true);
  });

  it.each([
    ['a number', 1],
    ['an object', { source: '.*' }],
    ['an over-long string', 'a'.repeat(MAX_SCAN_QR_CODE_PATTERN_LENGTH + 1)],
    ['an invalid regular expression', '('],
  ])('rejects %s with invalid params', (_, pattern) => {
    expect(() => buildScanQRCodeMatcher(pattern)).toThrow(
      expect.objectContaining({ code: -32602 }),
    );
  });
});

describe('getScanQRCodeResult', () => {
  it('returns raw scanned text', () => {
    expect(getScanQRCodeResult({ content: 'hello' }, 'hello', undefined)).toBe(
      'hello',
    );
    expect(getScanQRCodeResult('hello', undefined, undefined)).toBe('hello');
  });

  it('returns the raw ethereum URI instead of a scanner object', () => {
    const uri = `ethereum:${ADDRESS}@1`;
    expect(
      getScanQRCodeResult(
        { scheme: 'ethereum', target_address: ADDRESS, action: 'send-eth' },
        uri,
        undefined,
      ),
    ).toBe(uri);
  });

  it.each([
    ['seed object', { seed: MNEMONIC }, MNEMONIC],
    ['private key object', { private_key: PRIVATE_KEY }, PRIVATE_KEY],
    ['walletConnect object', { walletConnectURI: 'wc:a@2' }, 'wc:a@2'],
    ['raw mnemonic', { content: MNEMONIC }, MNEMONIC],
    ['raw private key', PRIVATE_KEY, undefined],
    ['0x private key', { content: `0x${PRIVATE_KEY}` }, `0x${PRIVATE_KEY}`],
  ])('rejects a %s without echoing it', (_, data, content) => {
    let thrown: unknown;
    try {
      getScanQRCodeResult(data, content, undefined);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ code: 4100 });
    const serialized = JSON.stringify(thrown);
    expect(serialized).not.toContain('verb middle');
    expect(serialized).not.toContain(PRIVATE_KEY);
  });

  it('checks wallet secrets before the dapp pattern', () => {
    expect(() =>
      getScanQRCodeResult({ content: MNEMONIC }, MNEMONIC, /^0x/u),
    ).toThrow(expect.objectContaining({ code: 4100 }));
  });

  it('rejects non-matching content without returning it', () => {
    let thrown: unknown;
    try {
      getScanQRCodeResult({ content: 'hello' }, 'hello', /^0x/u);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ message: 'NO_REGEX_MATCH' });
    expect(JSON.stringify(thrown)).not.toContain('hello');
  });

  it('rejects when there is no scanned text', () => {
    expect(() => getScanQRCodeResult({}, undefined, undefined)).toThrow(
      expect.objectContaining({ code: -32603 }),
    );
  });
});

describe('getScanQRCodeError', () => {
  it('maps a cancelled scan to a user rejection', () => {
    expect(getScanQRCodeError(SCAN_QR_CODE_USER_CANCELLED).code).toBe(4001);
  });

  it('maps blocked wallet-only content to unauthorized', () => {
    expect(getScanQRCodeError(SCAN_QR_CODE_WALLET_ONLY_CONTENT).code).toBe(
      4100,
    );
  });

  it('maps other errors to internal errors', () => {
    expect(getScanQRCodeError('camera failed')).toMatchObject({
      code: -32603,
      message: 'camera failed',
    });
  });
});

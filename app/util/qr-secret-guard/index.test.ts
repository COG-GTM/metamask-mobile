import { containsSecretQRData, isSecretQRContent } from '.';

const MNEMONIC_12 =
  'verb middle giant soon wage common wide tool gentle garlic issue nut';
const MNEMONIC_24 =
  'verb middle giant soon wage common wide tool gentle garlic issue nut retreat until album recall expire bronze bundle live accident expect dry cook';
const PRIVATE_KEY =
  '4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318';

describe('isSecretQRContent', () => {
  it.each([
    ['12 word mnemonic', MNEMONIC_12],
    ['24 word mnemonic', MNEMONIC_24],
    [
      'mnemonic with extra whitespace',
      `  ${MNEMONIC_12.replace(/ /g, '   ')} `,
    ],
    ['uppercase mnemonic', MNEMONIC_12.toUpperCase()],
    ['private key', PRIVATE_KEY],
    ['0x prefixed private key', `0x${PRIVATE_KEY}`],
    ['WalletConnect URI', 'wc:abc@2?relay-protocol=irn&symKey=deadbeef'],
    ['labelled private key', `private_key: 0x${PRIVATE_KEY}`],
    ['private key in JSON', `{"key":"${PRIVATE_KEY}"}`],
    ['labelled mnemonic', `seed: ${MNEMONIC_12}`],
    ['mnemonic in JSON', `{"mnemonic":"${MNEMONIC_24}"}`],
    [
      'numbered mnemonic',
      MNEMONIC_12.split(' ')
        .map((w, i) => `${i + 1}. ${w}`)
        .join('\n'),
    ],
  ])('detects %s', (_, content) => {
    expect(isSecretQRContent(content)).toBe(true);
  });

  it.each([
    ['address', '0x0000000000000000000000000000000000000001'],
    ['ethereum URI', 'ethereum:0x0000000000000000000000000000000000000001@1'],
    ['arbitrary text', 'hello world'],
    ['url', 'https://metamask.io'],
    [
      'non-mnemonic words',
      'one two three four five six seven eight nine ten eleven twelve',
    ],
    ['non-string', 123],
    ['64 non-hex characters', 'z'.repeat(64)],
    ['0x prefixed text', '0xhello'],
  ])('ignores %s', (_, content) => {
    expect(isSecretQRContent(content)).toBe(false);
  });
});

describe('containsSecretQRData', () => {
  it.each([
    [{ seed: MNEMONIC_12 }],
    [{ private_key: PRIVATE_KEY }],
    [{ walletConnectURI: 'wc:abc@2' }],
  ])('detects secret fields in scanner objects %#', (data) => {
    expect(containsSecretQRData(data)).toBe(true);
  });

  it('detects secret raw content even when data looks harmless', () => {
    expect(containsSecretQRData({}, MNEMONIC_12)).toBe(true);
  });

  it('allows a private_key field that is not a private key', () => {
    const content = 'z'.repeat(64);
    expect(containsSecretQRData({ private_key: content }, content)).toBe(false);
  });

  it('allows address scan results', () => {
    const address = '0x0000000000000000000000000000000000000001';
    expect(
      containsSecretQRData(
        { target_address: address, action: 'send-eth' },
        address,
      ),
    ).toBe(false);
  });
});

import {
  failedSeedPhraseRequirements,
  isSecretKeyMaterial,
  isWalletOnlyQRContent,
  parseSeedPhrase,
} from '.';

const VALID_24 =
  'verb middle giant soon wage common wide tool gentle garlic issue nut retreat until album recall expire bronze bundle live accident expect dry cook';
const VALID_12 = VALID_24.split(' ').splice(0, 12).join(' ');

describe('failedSeedPhraseRequirements', () => {
  it('Should pass for 12 word mnemonic', () => {
    expect(failedSeedPhraseRequirements(VALID_12)).toEqual(false);
  });
  it('Should pass for 24 word mnemonic', () => {
    expect(failedSeedPhraseRequirements(VALID_24)).toEqual(false);
  });
  it('Should fail for 12 + 1 word mnemonic', () => {
    const plus_one = VALID_12 + ' lol';
    expect(failedSeedPhraseRequirements(plus_one)).toEqual(true);
  });
  it('Should fail for 24 + 1 word mnemonic', () => {
    const plus_one = VALID_24 + ' lol';
    expect(failedSeedPhraseRequirements(plus_one)).toEqual(true);
  });
});

describe('parseSeedPhrase', () => {
  it('Should handle leading spaces', () => {
    expect(parseSeedPhrase(`   ${VALID_12}`)).toEqual(VALID_12);
  });
  it('Should handle trailing spaces', () => {
    expect(parseSeedPhrase(`${VALID_12}   `)).toEqual(VALID_12);
  });
  it('Should handle additional spaces', () => {
    expect(parseSeedPhrase(`${VALID_12.split(' ').join('   ')}   `)).toEqual(
      VALID_12,
    );
  });
  it('Should handle uppercase', () => {
    expect(parseSeedPhrase(`   ${String(VALID_12).toUpperCase()}`)).toEqual(
      VALID_12,
    );
  });
});

describe('isSecretKeyMaterial', () => {
  const PRIVATE_KEY =
    '4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318';

  it.each([
    ['12 word mnemonic', VALID_12],
    ['24 word mnemonic', VALID_24],
    [
      'upper case mnemonic with newlines',
      VALID_12.toUpperCase().replace(/ /gu, '\n'),
    ],
    [
      'numbered mnemonic',
      VALID_12.split(' ')
        .map((word, i) => `${i + 1}. ${word}`)
        .join(' '),
    ],
    ['raw private key', PRIVATE_KEY],
    ['0x private key', `0x${PRIVATE_KEY}`],
    ['private key with whitespace', ` ${PRIVATE_KEY}\n`],
    [
      'extended private key',
      'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
    ],
  ])('returns true for a %s', (_, content) => {
    expect(isSecretKeyMaterial(content)).toBe(true);
  });

  it.each([
    ['address', '0x29c76e6ad8f28bb1004902578fb108c507be341b'],
    ['ethereum URI', 'ethereum:0x29c76e6ad8f28bb1004902578fb108c507be341b@1'],
    ['url', 'https://metamask.io'],
    ['plain text', 'hello world'],
    ['11 mnemonic words', VALID_12.split(' ').slice(0, 11).join(' ')],
    [
      '12 words with an invalid checksum',
      `${VALID_12.split(' ').slice(0, 11).join(' ')} abandon`,
    ],
  ])('returns false for an %s', (_, content) => {
    expect(isSecretKeyMaterial(content)).toBe(false);
  });
});

describe('isWalletOnlyQRContent', () => {
  it.each([
    VALID_12,
    'wc:7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9@2?relay-protocol=irn&symKey=587d5484ce2a2a6ee3ba1962fdd7e8588e06200c46823bd18fbd67def96ad303',
    'metamask://wc?uri=wc:abc@2?symKey=def',
    'metamask-sync:abc|@|def',
  ])('returns true for %s', (content) => {
    expect(isWalletOnlyQRContent(content)).toBe(true);
  });

  it('returns false for an address', () => {
    expect(
      isWalletOnlyQRContent('0x29c76e6ad8f28bb1004902578fb108c507be341b'),
    ).toBe(false);
  });
});

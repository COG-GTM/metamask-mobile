import {
  shuffle,
  compareMnemonics,
  uint8ArrayToMnemonic,
  isHintSeedPhrase,
} from '.';

const mockSRPArrayOne = [
  'ar9gx',
  'e97vw',
  '95wx4',
  'c93d1',
  'zdiai',
  'h07an',
  '78eld',
  'snqx8',
  '1o472',
  'ixpwq',
  'p31fg',
  'vfnfy',
];

const mockSRPArrayTwo = [
  'r6rrh',
  'ujfkr',
  'n8n0h',
  '9fsgb',
  'obyjo',
  'a8wnk',
  'eqcnj',
  '4e55t',
  '170tl',
  'uur4s',
  '4wf4g',
  '242lz',
];

describe('mnemonic::shuffle', () => {
  it('should shuffle the array', () => {
    expect(mockSRPArrayOne.join('')).not.toEqual(
      shuffle(mockSRPArrayOne).join(''),
    );
  });
});

describe('mnemonic::compareMnemonics', () => {
  it('should return false', () => {
    expect(compareMnemonics(mockSRPArrayOne, mockSRPArrayTwo)).toBe(false);
  });
  it('should return true', () => {
    expect(compareMnemonics(mockSRPArrayOne, mockSRPArrayOne)).toBe(true);
  });
});

describe('mnemonic::uint8ArrayToMnemonic', () => {
  const mockWordlist = [
    'apple',
    'banana',
    'carrot',
    'dog',
    'elephant',
    'fox',
    'grape',
    'horse',
    'abandon',
    'jellyfish',
  ];

  it('should convert a Uint8Array to a seed phrase', () => {
    const uint8Array = new Uint8Array([
      0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 9, 0,
    ]);
    const expectedOutput =
      'apple banana carrot dog elephant fox grape horse abandon jellyfish';

    const result = uint8ArrayToMnemonic(uint8Array, mockWordlist);

    expect(result).toEqual(expectedOutput);
  });

  it('should handle an empty Uint8Array', () => {
    expect(() =>
      uint8ArrayToMnemonic(new Uint8Array([]), mockWordlist),
    ).toThrow('The method uint8ArrayToMnemonic expects a non-empty array');
  });
});

describe('isHintSeedPhrase', () => {
  const srp =
    'abandon ability able about above absent absorb abstract absurd abuse access accident';

  it('detects a 12-word Secret Recovery Phrase', () => {
    expect(isHintSeedPhrase(srp)).toBe(true);
  });

  it('detects an SRP regardless of case, numbering, punctuation or surrounding text', () => {
    const numbered = srp
      .toUpperCase()
      .split(' ')
      .map((word, i) => `${i + 1}. ${word},`)
      .join('\n');
    expect(isHintSeedPhrase(numbered)).toBe(true);
    expect(isHintSeedPhrase(`my srp is: ${srp} (keep safe)`)).toBe(true);
  });

  it('detects a 24-word SRP', () => {
    expect(isHintSeedPhrase(`${srp} ${srp}`)).toBe(true);
  });

  it('allows ordinary hints and partial word lists', () => {
    expect(isHintSeedPhrase('the blue notebook in my desk drawer')).toBe(false);
    expect(isHintSeedPhrase(srp.split(' ').slice(0, 11).join(' '))).toBe(false);
    expect(isHintSeedPhrase('')).toBe(false);
  });

  it('detects a checksum-valid SRP interleaved with labels', () => {
    const labelled = (words: string[]) =>
      words.map((word, i) => `zz${'q'.repeat(i)}: ${word}`).join(' ');
    expect(
      isHintSeedPhrase(labelled([...Array(11).fill('abandon'), 'about'])),
    ).toBe(true);
    expect(
      isHintSeedPhrase(labelled([...Array(23).fill('abandon'), 'art'])),
    ).toBe(true);
  });

  it('does not count words outside the BIP-39 list towards a run', () => {
    const words = srp.split(' ');
    words.splice(6, 0, 'notaword');
    expect(isHintSeedPhrase(words.join(' '))).toBe(false);
  });
});

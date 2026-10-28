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

describe('mnemonic::isHintSeedPhrase', () => {
  const srp =
    'abandon ability able about above absent absorb abstract absurd abuse access accident';
  const srpWords = srp.split(' ');

  it('rejects the exact SRP with or without the known words', () => {
    expect(isHintSeedPhrase(srp)).toBe(true);
    expect(isHintSeedPhrase(srp, srpWords)).toBe(true);
  });

  it('ignores case, numbering, punctuation and surrounding text', () => {
    const numbered = srpWords
      .map((word, i) => `${i + 1}. ${word.toUpperCase()},`)
      .join('\n');
    expect(isHintSeedPhrase(numbered)).toBe(true);
    expect(isHintSeedPhrase(`my phrase: ${srp} (keep safe)`)).toBe(true);
    const lettered = srpWords
      .map((word, i) => `${String.fromCharCode(97 + i)}) ${word}`)
      .join(' ');
    expect(isHintSeedPhrase(lettered)).toBe(true);
  });

  it('rejects a 24-word SRP', () => {
    expect(isHintSeedPhrase(`${srp} ${srp}`)).toBe(true);
  });

  it('rejects most of the known SRP words in order', () => {
    const partial = srpWords.slice(0, 7).join(' ');
    expect(isHintSeedPhrase(partial, srpWords)).toBe(true);
    const interleaved = srpWords.filter((_, i) => i % 3 !== 0).join(' then ');
    expect(isHintSeedPhrase(interleaved, srpWords)).toBe(true);
  });

  it('allows ordinary hints and a minority of the SRP words', () => {
    expect(isHintSeedPhrase('the blue notebook in my desk drawer')).toBe(false);
    expect(
      isHintSeedPhrase('the blue notebook in my desk drawer', srpWords),
    ).toBe(false);
    expect(isHintSeedPhrase(srpWords.slice(0, 6).join(' '), srpWords)).toBe(
      false,
    );
    expect(isHintSeedPhrase(srpWords.slice(0, 11).join(' '))).toBe(false);
    expect(isHintSeedPhrase('')).toBe(false);
  });

  it('does not count SRP words out of order as a match', () => {
    const reversed = [...srpWords].slice(0, 7).reverse().join(' ');
    expect(isHintSeedPhrase(reversed, srpWords)).toBe(false);
  });
});

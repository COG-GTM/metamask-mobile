import isValidOriginatorInfo from './isValidOriginatorInfo';

describe('isValidOriginatorInfo', () => {
  it('accepts an object with non-empty string url and title', () => {
    expect(
      isValidOriginatorInfo({
        url: 'https://dapp.example',
        title: 'Dapp',
        platform: 'ios',
      }),
    ).toBe(true);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'https://dapp.example'],
    ['a number', 42],
    ['an array', [{ url: 'https://dapp.example', title: 'Dapp' }]],
    ['an empty object', {}],
    ['a missing title', { url: 'https://dapp.example' }],
    ['a missing url', { title: 'Dapp' }],
    ['a non-string url', { url: 1, title: 'Dapp' }],
    ['a non-string title', { url: 'https://dapp.example', title: {} }],
    ['an empty url', { url: '', title: 'Dapp' }],
    ['an empty title', { url: 'https://dapp.example', title: '' }],
  ])('rejects %s', (_label, value) => {
    expect(isValidOriginatorInfo(value)).toBe(false);
  });
});

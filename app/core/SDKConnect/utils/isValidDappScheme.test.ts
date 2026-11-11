import { isValidDappScheme } from './isValidDappScheme';

describe('isValidDappScheme', () => {
  it.each(['mydapp', 'com.example.app', 'dapp-v2', 'x+y', 'MyDapp'])(
    'accepts custom app scheme %s',
    (scheme) => {
      expect(isValidDappScheme(scheme)).toBe(true);
    },
  );

  it.each([
    'https://evil.example/login#',
    'https',
    'HTTP',
    'tel',
    'sms',
    'mailto',
    'metamask',
    'ethereum',
    'wc',
    'javascript',
    'data',
    'file',
    'itms-services',
    'evil.example/#',
    'mydapp://x',
    'my dapp',
    '1dapp',
    '-dapp',
    '',
    'a'.repeat(65),
    undefined,
    null,
    42,
  ])('rejects %p', (scheme) => {
    expect(isValidDappScheme(scheme)).toBe(false);
  });
});

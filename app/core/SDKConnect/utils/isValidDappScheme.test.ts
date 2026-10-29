import isValidDappScheme from './isValidDappScheme';

describe('isValidDappScheme', () => {
  it.each(['acme', 'myapp', 'com.acme.app', 'acme-swap', 'acme+dev'])(
    'accepts custom scheme %s',
    (scheme) => {
      expect(isValidDappScheme(scheme)).toBe(true);
    },
  );

  it.each([
    undefined,
    '',
    'https://evil.example/?x=',
    'http',
    'HTTPS',
    'javascript',
    'metamask',
    'data',
    'file',
    '1acme',
    'acme://',
    'ac me',
  ])('rejects %s', (scheme) => {
    expect(isValidDappScheme(scheme)).toBe(false);
  });
});

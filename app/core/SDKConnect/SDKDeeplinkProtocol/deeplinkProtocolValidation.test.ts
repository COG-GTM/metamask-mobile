import {
  isValidDappScheme,
  parseDeeplinkOriginatorInfo,
} from './deeplinkProtocolValidation';

const encode = (payload: unknown) =>
  Buffer.from(JSON.stringify(payload)).toString('base64');

describe('isValidDappScheme', () => {
  it.each(['mydapp', 'my-dapp', 'com.example.dapp', 'dapp+v2', 'A1'])(
    'accepts plain custom scheme %s',
    (scheme) => {
      expect(isValidDappScheme(scheme)).toBe(true);
    },
  );

  it.each([
    'https://mallory.example/c?d=',
    'https',
    'HTTP',
    'javascript',
    'metamask',
    'wc',
    'mydapp://x',
    'my/dapp',
    'my dapp',
    '1dapp',
    '',
    'a'.repeat(65),
    undefined,
    42,
  ])('rejects %p', (scheme) => {
    expect(isValidDappScheme(scheme)).toBe(false);
  });
});

describe('parseDeeplinkOriginatorInfo', () => {
  it('returns the validated originatorInfo with the url reduced to its origin', () => {
    expect(
      parseDeeplinkOriginatorInfo(
        encode({
          originatorInfo: {
            url: 'https://app.example.com/path?x=1',
            title: 'Example',
            platform: 'ios',
            dappId: 'example',
            icon: 'https://app.example.com/icon.png',
            apiVersion: '1.0.0',
            extra: 'dropped',
          },
        }),
      ),
    ).toStrictEqual({
      url: 'https://app.example.com',
      title: 'Example',
      platform: 'ios',
      dappId: 'example',
      icon: 'https://app.example.com/icon.png',
      apiVersion: '1.0.0',
    });
  });

  it('drops icons that are not https or inline images', () => {
    const info = parseDeeplinkOriginatorInfo(
      encode({
        originatorInfo: {
          url: 'https://app.example.com',
          title: 'Example',
          icon: 'http://tracker.example/pixel.png',
        },
      }),
    );
    expect(info.icon).toBeUndefined();
  });

  it.each([
    ['non base64/JSON payload', 'test-originator-info'],
    ['missing wrapper', encode({ url: 'https://a.com', title: 'A' })],
    ['missing title', encode({ originatorInfo: { url: 'https://a.com' } })],
    [
      'non-web url',
      encode({ originatorInfo: { url: 'ftp://app.uniswap.org', title: 'A' } }),
    ],
    ['relative url', encode({ originatorInfo: { url: 'a.com', title: 'A' } })],
    [
      'non-string optional field',
      encode({
        originatorInfo: { url: 'https://a.com', title: 'A', icon: {} },
      }),
    ],
  ])('throws for %s', (_label, payload) => {
    expect(() => parseDeeplinkOriginatorInfo(payload)).toThrow();
  });
});

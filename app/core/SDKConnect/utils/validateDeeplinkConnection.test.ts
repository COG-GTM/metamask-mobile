import {
  hasValidOriginatorIdentity,
  isValidChannelId,
} from './validateDeeplinkConnection';

describe('isValidChannelId', () => {
  it('accepts a uuid channel id', () => {
    expect(isValidChannelId('9b9d1e1e-9b0e-4a3a-9e5f-3f2b7c6f1a11')).toBe(true);
  });

  it.each([
    undefined,
    '',
    'app.uniswap.org',
    'https://app.uniswap.org',
    '9b9d1e1e9b0e4a3a9e5f3f2b7c6f1a11',
  ])('rejects %s', (channelId) => {
    expect(isValidChannelId(channelId)).toBe(false);
  });
});

describe('hasValidOriginatorIdentity', () => {
  it('accepts an originator with a url and a title', () => {
    expect(
      hasValidOriginatorIdentity({ url: 'https://dapp.io', title: 'Dapp' }),
    ).toBe(true);
  });

  it.each([undefined, null, 'dapp', { url: 'https://dapp.io' }, { title: 1 }])(
    'rejects %s',
    (originatorInfo) => {
      expect(hasValidOriginatorIdentity(originatorInfo)).toBe(false);
    },
  );
});

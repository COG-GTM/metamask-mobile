import TransactionTypes from '../../TransactionTypes';
import isValidAndroidSDKClientId from './isValidAndroidSDKClientId';

describe('isValidAndroidSDKClientId', () => {
  it('accepts a UUID', () => {
    expect(
      isValidAndroidSDKClientId('3f1c2a9e-8b7d-4c6e-9a5f-1b2c3d4e5f60'),
    ).toBe(true);
  });

  it.each([
    TransactionTypes.MMM,
    'MetaMask Mobile',
    'app.uniswap.org',
    'MMSDKREMOTE::3f1c2a9e-8b7d-4c6e-9a5f-1b2c3d4e5f60',
    '3f1c2a9e-8b7d-4c6e-9a5f-1b2c3d4e5f60\n',
    '',
    undefined,
    null,
    42,
    {},
  ])('rejects %p', (clientId) => {
    expect(isValidAndroidSDKClientId(clientId)).toBe(false);
  });
});

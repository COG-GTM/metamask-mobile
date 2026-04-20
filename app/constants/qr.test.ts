import { SUPPORTED_UR_TYPE } from './qr';

describe('qr constants', () => {
  it('defines CRYPTO_HDKEY', () => {
    expect(SUPPORTED_UR_TYPE.CRYPTO_HDKEY).toBe('crypto-hdkey');
  });

  it('defines CRYPTO_ACCOUNT', () => {
    expect(SUPPORTED_UR_TYPE.CRYPTO_ACCOUNT).toBe('crypto-account');
  });

  it('defines ETH_SIGNATURE', () => {
    expect(SUPPORTED_UR_TYPE.ETH_SIGNATURE).toBe('eth-signature');
  });
});

import { KeyringTypes } from '@metamask/keyring-controller';
import { getAccountItemHeight } from './utils';

describe('getAccountItemHeight', () => {
  it('returns the base height for an HD account without errors', () => {
    expect(
      getAccountItemHeight({ type: KeyringTypes.hd, balanceError: undefined }),
    ).toBe(78);
  });

  it('adds height for the keyring tag label on non-HD accounts', () => {
    expect(
      getAccountItemHeight({
        type: KeyringTypes.simple,
        balanceError: undefined,
      }),
    ).toBe(102);
  });

  it('adds height for a balance error', () => {
    expect(
      getAccountItemHeight({
        type: KeyringTypes.hd,
        balanceError: 'Insufficient funds',
      }),
    ).toBe(100);
  });

  it('adds height for both a balance error and a tag label', () => {
    expect(
      getAccountItemHeight({
        type: KeyringTypes.qr,
        balanceError: 'Insufficient funds',
      }),
    ).toBe(124);
  });
});

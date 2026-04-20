import { KeyringTypes } from '@metamask/keyring-controller';
import {
  MOCK_HD_ACCOUNTS,
  MOCK_HD_KEYRING_METADATA,
  MOCK_KEYRINGS,
  MOCK_KEYRINGS_WITH_METADATA,
  MOCK_KEYRING_CONTROLLER,
  MOCK_KEYRING_METADATA,
  MOCK_QR_ACCOUNTS,
  MOCK_QR_KEYRING_METADATA,
  MOCK_SIMPLE_ACCOUNTS,
  MOCK_SIMPLE_KEYRING_METADATA,
} from './testUtils';

describe('keyringController/testUtils', () => {
  it('exposes mock simple/qr/hd accounts', () => {
    expect(MOCK_SIMPLE_ACCOUNTS).toEqual(['0x1', '0x2']);
    expect(MOCK_QR_ACCOUNTS).toEqual(['0x3', '0x4']);
    expect(MOCK_HD_ACCOUNTS).toEqual(['0x5', '0x6']);
  });

  it('keyring metadata entries have id and name fields', () => {
    [
      MOCK_SIMPLE_KEYRING_METADATA,
      MOCK_QR_KEYRING_METADATA,
      MOCK_HD_KEYRING_METADATA,
    ].forEach((entry) => {
      expect(entry).toEqual(
        expect.objectContaining({ id: expect.any(String), name: '' }),
      );
    });
    expect(MOCK_KEYRING_METADATA).toHaveLength(3);
  });

  it('MOCK_KEYRINGS_WITH_METADATA pairs accounts with matching metadata and keyring type', () => {
    expect(MOCK_KEYRINGS_WITH_METADATA).toEqual([
      {
        accounts: MOCK_SIMPLE_ACCOUNTS,
        type: KeyringTypes.simple,
        metadata: MOCK_SIMPLE_KEYRING_METADATA,
      },
      {
        accounts: MOCK_QR_ACCOUNTS,
        type: KeyringTypes.qr,
        metadata: MOCK_QR_KEYRING_METADATA,
      },
      {
        accounts: MOCK_HD_ACCOUNTS,
        type: KeyringTypes.hd,
        metadata: MOCK_HD_KEYRING_METADATA,
      },
    ]);
  });

  it('MOCK_KEYRINGS mirrors the metadata list without metadata fields', () => {
    expect(MOCK_KEYRINGS).toEqual([
      { accounts: MOCK_SIMPLE_ACCOUNTS, type: KeyringTypes.simple },
      { accounts: MOCK_QR_ACCOUNTS, type: KeyringTypes.qr },
      { accounts: MOCK_HD_ACCOUNTS, type: KeyringTypes.hd },
    ]);
  });

  it('MOCK_KEYRING_CONTROLLER is unlocked with expected keyrings + metadata', () => {
    expect(MOCK_KEYRING_CONTROLLER).toEqual({
      isUnlocked: true,
      keyrings: MOCK_KEYRINGS,
      keyringsMetadata: MOCK_KEYRING_METADATA,
    });
  });
});

import {
  KeyringControllerState,
  KeyringTypes,
} from '@metamask/keyring-controller';
import {
  selectKeyrings,
  selectFlattenedKeyringAccounts,
  selectIsUnlocked,
  hasMultipleHDKeyrings,
} from './index';
import { RootState } from '../../reducers';
import {
  MOCK_SIMPLE_ACCOUNTS,
  MOCK_QR_ACCOUNTS,
  MOCK_HD_ACCOUNTS,
  MOCK_KEYRINGS,
  MOCK_KEYRINGS_WITH_METADATA,
  MOCK_KEYRING_CONTROLLER,
} from './testUtils';

const buildState = (KeyringController: KeyringControllerState) =>
  ({
    engine: {
      backgroundState: {
        KeyringController,
      },
    },
  } as RootState);

describe('KeyringController Selectors', () => {
  describe('selectKeyrings', () => {
    it('returns keyrings', () => {
      expect(
        selectKeyrings({
          engine: {
            backgroundState: {
              KeyringController: MOCK_KEYRING_CONTROLLER,
            },
          },
        } as RootState),
      ).toEqual(MOCK_KEYRINGS_WITH_METADATA);
    });

    it('returns empty metadata when keyringsMetadata is missing', () => {
      const { keyringsMetadata: _, ...stateWithoutMetadata } =
        MOCK_KEYRING_CONTROLLER;
      expect(
        selectKeyrings(
          buildState(stateWithoutMetadata as KeyringControllerState),
        ),
      ).toEqual(MOCK_KEYRINGS.map((keyring) => ({ ...keyring, metadata: {} })));
    });

    it('returns empty metadata for keyrings without a metadata entry', () => {
      const keyrings = selectKeyrings(
        buildState({
          ...MOCK_KEYRING_CONTROLLER,
          keyringsMetadata: MOCK_KEYRING_CONTROLLER.keyringsMetadata.slice(
            0,
            1,
          ),
        }),
      );
      expect(keyrings.map((keyring) => keyring.metadata)).toEqual([
        MOCK_KEYRING_CONTROLLER.keyringsMetadata[0],
        {},
        {},
      ]);
    });
  });
  describe('hasMultipleHDKeyrings', () => {
    it('returns false with one HD keyring alongside simple and QR keyrings', () => {
      expect(hasMultipleHDKeyrings(buildState(MOCK_KEYRING_CONTROLLER))).toBe(
        false,
      );
    });

    it('returns true with two HD keyrings', () => {
      expect(
        hasMultipleHDKeyrings(
          buildState({
            ...MOCK_KEYRING_CONTROLLER,
            keyrings: [
              ...MOCK_KEYRINGS,
              { accounts: ['0x7'], type: KeyringTypes.hd },
            ],
            keyringsMetadata: [
              ...MOCK_KEYRING_CONTROLLER.keyringsMetadata,
              { id: '01JPM6NFVGW8V8KKN34053JVFU', name: '' },
            ],
          }),
        ),
      ).toBe(true);
    });

    it('returns false when there are no HD keyrings', () => {
      expect(
        hasMultipleHDKeyrings(
          buildState({
            ...MOCK_KEYRING_CONTROLLER,
            keyrings: MOCK_KEYRINGS.filter(
              (keyring) => keyring.type !== KeyringTypes.hd,
            ),
          }),
        ),
      ).toBe(false);
    });
  });
  describe('selectFlattenedKeyringAccounts', () => {
    it('returns flattened keyring accounts', () => {
      const expectedOrderedKeyringAccounts = [
        ...MOCK_SIMPLE_ACCOUNTS,
        ...MOCK_QR_ACCOUNTS,
        ...MOCK_HD_ACCOUNTS,
      ];
      expect(
        selectFlattenedKeyringAccounts({
          engine: {
            backgroundState: {
              KeyringController: MOCK_KEYRING_CONTROLLER,
            },
          },
        } as RootState),
      ).toEqual(expectedOrderedKeyringAccounts);
    });
  });
  describe('selectIsUnlocked', () => {
    it('returns isUnlocked', () => {
      expect(
        selectIsUnlocked({
          engine: {
            backgroundState: {
              KeyringController: MOCK_KEYRING_CONTROLLER,
            },
          },
        } as RootState),
      ).toEqual(MOCK_KEYRING_CONTROLLER.isUnlocked);
    });
  });
});

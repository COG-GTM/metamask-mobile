import Logger from '../util/Logger';
import Engine from './Engine';
import { withLedgerKeyring } from './Ledger/Ledger';

import { KeyringTypes } from '@metamask/keyring-controller';

import {
  recreateVaultWithNewPassword,
  restoreLedgerKeyring,
  restoreQRKeyring,
} from './Vault';

jest.mock('./Engine', () => ({
  context: {
    KeyringController: {
      restoreQRKeyring: jest.fn(),
      withKeyring: jest.fn(),
      state: { keyrings: [], keyringsMetadata: [] },
      exportSeedPhrase: jest.fn(),
      exportAccount: jest.fn(),
      createNewVaultAndRestore: jest.fn(),
      addNewAccount: jest.fn(),
      addNewKeyring: jest.fn(),
      importAccountWithStrategy: jest.fn(),
    },
  },
  setSelectedAddress: jest.fn(),
}));
const MockEngine = jest.mocked(Engine);

jest.mock('./Ledger/Ledger', () => ({
  withLedgerKeyring: jest.fn(),
}));
const mockWithLedgerKeyring = jest.mocked(withLedgerKeyring);

jest.mock('../util/Logger', () => ({
  error: jest.fn(),
}));

describe('Vault', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('restoreQRKeyring', () => {
    it('should restore QR keyring if it exists', async () => {
      const { KeyringController } = MockEngine.context;
      const mockSerializedQrKeyring = 'serialized-keyring';

      await restoreQRKeyring(mockSerializedQrKeyring);

      expect(
        MockEngine.context.KeyringController.restoreQRKeyring,
      ).toHaveBeenCalled();
      expect(KeyringController.restoreQRKeyring).toHaveBeenCalledWith(
        mockSerializedQrKeyring,
      );
    });

    it('should log error if an exception is thrown', async () => {
      const error = new Error('Test error');
      MockEngine.context.KeyringController.restoreQRKeyring.mockRejectedValue(
        error,
      );
      const mockSerializedQrKeyring = 'serialized-keyring';

      await restoreQRKeyring(mockSerializedQrKeyring);

      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'error while trying to get qr accounts on recreate vault',
      );
    });
  });

  describe('restoreLedgerKeyring', () => {
    it('should restore ledger keyring if it exists', async () => {
      const mockLedgerKeyring = {
        deserialize: jest.fn(),
      };
      mockWithLedgerKeyring.mockImplementation(
        // @ts-expect-error The Ledger keyring is not compatible with our keyring type yet
        (operation) => operation(mockLedgerKeyring),
      );
      const mockSerializedLedgerKeyring = 'serialized-keyring';

      await restoreLedgerKeyring(mockSerializedLedgerKeyring);

      expect(mockLedgerKeyring.deserialize).toHaveBeenCalledWith(
        mockSerializedLedgerKeyring,
      );
    });

    it('should log error if the Ledger keyring throws an error', async () => {
      const error = new Error('Test error');
      const mockLedgerKeyring = {
        deserialize: jest.fn().mockRejectedValue(error),
      };
      mockWithLedgerKeyring.mockImplementation(
        // @ts-expect-error The Ledger keyring is not compatible with our keyring type yet
        (operation) => operation(mockLedgerKeyring),
      );
      const mockSerializedLedgerKeyring = 'serialized-keyring';

      await restoreLedgerKeyring(mockSerializedLedgerKeyring);

      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'error while trying to restore Ledger accounts on recreate vault',
      );
    });

    it('should log error if the KeyringController throws an error', async () => {
      const error = new Error('Test error');
      mockWithLedgerKeyring.mockRejectedValue(error);
      const mockSerializedLedgerKeyring = 'serialized-keyring';

      await restoreLedgerKeyring(mockSerializedLedgerKeyring);

      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'error while trying to restore Ledger accounts on recreate vault',
      );
    });
  });

  describe('recreateVaultWithNewPassword', () => {
    const PRIMARY_MNEMONIC = new Uint8Array([1]);
    const SECONDARY_MNEMONIC = new Uint8Array([2]);
    const PRIMARY_ACCOUNTS = ['0xa1', '0xa2'];
    const SECONDARY_ACCOUNTS = ['0xb1', '0xb2', '0xb3'];
    const IMPORTED_ACCOUNT = '0xc1';

    // Minimal in-memory stand-in for the KeyringController keyring state
    const setUpKeyringController = () => {
      const KeyringController = MockEngine.context
        .KeyringController as unknown as Record<string, jest.Mock> & {
        state: {
          keyrings: { type: string; accounts: string[] }[];
          keyringsMetadata: { id: string; name: string }[];
        };
      };
      const mnemonics: Record<string, Uint8Array> = {
        'primary-id': PRIMARY_MNEMONIC,
        'secondary-id': SECONDARY_MNEMONIC,
      };
      const accountsByMnemonic = new Map([
        [PRIMARY_MNEMONIC, PRIMARY_ACCOUNTS],
        [SECONDARY_MNEMONIC, SECONDARY_ACCOUNTS],
      ]);
      KeyringController.state = {
        keyrings: [
          { type: KeyringTypes.hd, accounts: [...PRIMARY_ACCOUNTS] },
          { type: KeyringTypes.simple, accounts: [IMPORTED_ACCOUNT] },
          { type: KeyringTypes.hd, accounts: [...SECONDARY_ACCOUNTS] },
        ],
        keyringsMetadata: [
          { id: 'primary-id', name: '' },
          { id: 'simple-id', name: '' },
          { id: 'secondary-id', name: '' },
        ],
      };
      KeyringController.exportSeedPhrase.mockImplementation(
        async (_password: string, keyringId?: string) =>
          mnemonics[keyringId ?? 'primary-id'],
      );
      KeyringController.exportAccount.mockResolvedValue('private-key');
      KeyringController.createNewVaultAndRestore.mockImplementation(
        async (_password: string, mnemonic: Uint8Array) => {
          KeyringController.state.keyrings = [
            {
              type: KeyringTypes.hd,
              accounts: (accountsByMnemonic.get(mnemonic) ?? []).slice(0, 1),
            },
          ];
        },
      );
      KeyringController.addNewAccount.mockImplementation(async () => {
        const primary = KeyringController.state.keyrings[0];
        primary.accounts.push(
          (accountsByMnemonic.get(PRIMARY_MNEMONIC) ?? [])[
            primary.accounts.length
          ],
        );
      });
      KeyringController.addNewKeyring.mockImplementation(
        async (
          type: string,
          opts: { mnemonic: Uint8Array; numberOfAccounts: number },
        ) => {
          KeyringController.state.keyrings.push({
            type,
            accounts: (accountsByMnemonic.get(opts.mnemonic) ?? []).slice(
              0,
              opts.numberOfAccounts,
            ),
          });
        },
      );
      KeyringController.importAccountWithStrategy.mockImplementation(
        async () => {
          KeyringController.state.keyrings.push({
            type: KeyringTypes.simple,
            accounts: [IMPORTED_ACCOUNT],
          });
        },
      );
      return KeyringController;
    };

    it('restores every HD keyring with its accounts after recreating the vault', async () => {
      const KeyringController = setUpKeyringController();

      await recreateVaultWithNewPassword(
        'old-password',
        'new-password',
        '0xb2',
      );

      expect(KeyringController.exportSeedPhrase).toHaveBeenCalledWith(
        'old-password',
        'primary-id',
      );
      expect(KeyringController.exportSeedPhrase).toHaveBeenCalledWith(
        'old-password',
        'secondary-id',
      );
      expect(KeyringController.createNewVaultAndRestore).toHaveBeenCalledWith(
        'new-password',
        PRIMARY_MNEMONIC,
      );
      expect(KeyringController.addNewKeyring).toHaveBeenCalledWith(
        KeyringTypes.hd,
        { mnemonic: SECONDARY_MNEMONIC, numberOfAccounts: 3 },
      );

      const hdKeyrings = KeyringController.state.keyrings.filter(
        (keyring) => keyring.type === KeyringTypes.hd,
      );
      expect(hdKeyrings.map((keyring) => keyring.accounts)).toStrictEqual([
        PRIMARY_ACCOUNTS,
        SECONDARY_ACCOUNTS,
      ]);
      expect(KeyringController.importAccountWithStrategy).toHaveBeenCalledWith(
        'privateKey',
        ['private-key'],
      );
      expect(MockEngine.setSelectedAddress).toHaveBeenCalledWith('0xb2');
    });

    it('does not recreate the vault if a secondary seed phrase cannot be exported', async () => {
      const KeyringController = setUpKeyringController();
      KeyringController.exportSeedPhrase.mockImplementation(
        async (_password: string, keyringId?: string) => {
          if (keyringId === 'secondary-id') {
            throw new Error('Keyring not found');
          }
          return PRIMARY_MNEMONIC;
        },
      );

      await expect(
        recreateVaultWithNewPassword('old-password', 'new-password', '0xa1'),
      ).rejects.toThrow('Keyring not found');
      expect(KeyringController.createNewVaultAndRestore).not.toHaveBeenCalled();
    });

    it('does not recreate the vault if a secondary HD keyring has no metadata', async () => {
      const KeyringController = setUpKeyringController();
      KeyringController.state.keyringsMetadata = [
        { id: 'primary-id', name: '' },
      ];

      await expect(
        recreateVaultWithNewPassword('old-password', 'new-password', '0xa1'),
      ).rejects.toThrow('Missing metadata for HD keyring');
      expect(KeyringController.createNewVaultAndRestore).not.toHaveBeenCalled();
    });
  });
});

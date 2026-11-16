import { KeyringTypes } from '@metamask/keyring-controller';
import Logger from '../util/Logger';
import Engine from './Engine';
import { withLedgerKeyring } from './Ledger/Ledger';

import {
  recreateVaultWithNewPassword,
  recreateVaultWithSamePassword,
  restoreLedgerKeyring,
  restoreQRKeyring,
} from './Vault';

interface MockKeyring {
  type: string;
  accounts: string[];
}

const mockKeyringController = {
  state: { keyrings: [] as MockKeyring[] },
  restoreQRKeyring: jest.fn(),
  withKeyring: jest.fn(),
  exportSeedPhrase: jest.fn(),
  exportAccount: jest.fn(),
  createNewVaultAndRestore: jest.fn(),
  addNewAccount: jest.fn(),
  importAccountWithStrategy: jest.fn(),
};
const mockSetSelectedAddress = jest.fn();

jest.mock('./Engine', () => ({
  context: {
    get KeyringController() {
      return mockKeyringController;
    },
  },
  setSelectedAddress: (...args: unknown[]) => mockSetSelectedAddress(...args),
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
    const PASSWORD = 'old-password';
    const NEW_PASSWORD = 'new-password';
    const SEED_PHRASE = 'seed phrase words';
    const HD_ACCOUNTS = ['0xaaa1', '0xaaa2', '0xaaa3'];

    const setKeyrings = (keyrings: MockKeyring[]) => {
      mockKeyringController.state.keyrings = keyrings;
    };

    beforeEach(() => {
      mockKeyringController.exportSeedPhrase.mockResolvedValue(SEED_PHRASE);
      mockKeyringController.exportAccount.mockImplementation(
        async (_password: string, address: string) => `pk-${address}`,
      );
      mockKeyringController.createNewVaultAndRestore.mockResolvedValue(
        undefined,
      );
      mockKeyringController.addNewAccount.mockResolvedValue(undefined);
      mockKeyringController.importAccountWithStrategy.mockResolvedValue(
        undefined,
      );
      mockKeyringController.restoreQRKeyring.mockResolvedValue(undefined);
      mockKeyringController.withKeyring.mockImplementation(
        async ({ type }: { type: string }, operation) =>
          operation({
            keyring: { serialize: async () => `serialized-${type}` },
          }),
      );
      mockWithLedgerKeyring.mockReset();
      setKeyrings([{ type: KeyringTypes.hd, accounts: HD_ACCOUNTS }]);
    });

    it('recreates the vault with the new password and re-derives HD accounts', async () => {
      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1');

      expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledWith(
        PASSWORD,
      );
      expect(
        mockKeyringController.createNewVaultAndRestore,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockKeyringController.createNewVaultAndRestore,
      ).toHaveBeenCalledWith(NEW_PASSWORD, SEED_PHRASE);
      expect(mockKeyringController.addNewAccount).toHaveBeenCalledTimes(
        HD_ACCOUNTS.length - 1,
      );
      expect(
        mockKeyringController.importAccountWithStrategy,
      ).not.toHaveBeenCalled();
      expect(mockKeyringController.withKeyring).not.toHaveBeenCalled();
    });

    it('re-derives accounts only after the vault has been recreated', async () => {
      const callOrder: string[] = [];
      mockKeyringController.createNewVaultAndRestore.mockImplementation(
        async () => {
          await Promise.resolve();
          callOrder.push('createNewVaultAndRestore');
        },
      );
      mockKeyringController.addNewAccount.mockImplementation(async () => {
        callOrder.push('addNewAccount');
      });

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1');

      expect(callOrder).toEqual([
        'createNewVaultAndRestore',
        'addNewAccount',
        'addNewAccount',
      ]);
    });

    it('does not add accounts when the HD keyring has a single account', async () => {
      setKeyrings([{ type: KeyringTypes.hd, accounts: ['0xaaa1'] }]);

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1');

      expect(mockKeyringController.addNewAccount).not.toHaveBeenCalled();
    });

    it('exports and re-imports every account from all simple keyrings after recreating the vault', async () => {
      setKeyrings([
        { type: KeyringTypes.hd, accounts: ['0xaaa1'] },
        { type: KeyringTypes.simple, accounts: ['0xbbb1', '0xbbb2'] },
        { type: KeyringTypes.simple, accounts: ['0xccc1'] },
      ]);
      const callOrder: string[] = [];
      mockKeyringController.createNewVaultAndRestore.mockImplementation(
        async () => {
          await Promise.resolve();
          callOrder.push('createNewVaultAndRestore');
        },
      );
      mockKeyringController.importAccountWithStrategy.mockImplementation(
        async () => {
          callOrder.push('importAccountWithStrategy');
        },
      );

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1');

      expect(mockKeyringController.exportAccount).toHaveBeenCalledTimes(3);
      expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
        PASSWORD,
        '0xbbb1',
      );
      expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
        PASSWORD,
        '0xbbb2',
      );
      expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
        PASSWORD,
        '0xccc1',
      );
      expect(
        mockKeyringController.importAccountWithStrategy.mock.calls,
      ).toEqual([
        ['privateKey', ['pk-0xbbb1']],
        ['privateKey', ['pk-0xbbb2']],
        ['privateKey', ['pk-0xccc1']],
      ]);
      expect(callOrder[0]).toBe('createNewVaultAndRestore');
      // Simple keyring accounts must not be counted as HD accounts
      expect(mockKeyringController.addNewAccount).not.toHaveBeenCalled();
    });

    it('logs and continues without importing when exporting an imported account fails', async () => {
      const error = new Error('export failed');
      setKeyrings([
        { type: KeyringTypes.hd, accounts: ['0xaaa1'] },
        { type: KeyringTypes.simple, accounts: ['0xbbb1'] },
      ]);
      mockKeyringController.exportAccount.mockRejectedValue(error);

      await expect(
        recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1'),
      ).resolves.toBeUndefined();

      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'error while trying to get imported accounts on recreate vault',
      );
      // Current behaviour: the vault is still recreated and imported keys are dropped
      expect(
        mockKeyringController.createNewVaultAndRestore,
      ).toHaveBeenCalledWith(NEW_PASSWORD, SEED_PHRASE);
      expect(
        mockKeyringController.importAccountWithStrategy,
      ).not.toHaveBeenCalled();
    });

    it('logs and stops importing remaining accounts when an import fails', async () => {
      const error = new Error('import failed');
      setKeyrings([
        { type: KeyringTypes.hd, accounts: ['0xaaa1'] },
        {
          type: KeyringTypes.simple,
          accounts: ['0xbbb1', '0xbbb2', '0xbbb3'],
        },
      ]);
      mockKeyringController.importAccountWithStrategy
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(error);

      await expect(
        recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1'),
      ).resolves.toBeUndefined();

      expect(
        mockKeyringController.importAccountWithStrategy.mock.calls,
      ).toEqual([
        ['privateKey', ['pk-0xbbb1']],
        ['privateKey', ['pk-0xbbb2']],
      ]);
      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'error while trying to import accounts on recreate vault',
      );
    });

    it('serializes and restores Ledger and QR keyrings when present', async () => {
      const mockLedgerKeyring = { deserialize: jest.fn() };
      mockWithLedgerKeyring.mockImplementation(
        // @ts-expect-error The Ledger keyring is not compatible with our keyring type yet
        (operation) => operation(mockLedgerKeyring),
      );
      setKeyrings([
        { type: KeyringTypes.hd, accounts: ['0xaaa1'] },
        { type: KeyringTypes.ledger, accounts: ['0xddd1'] },
        { type: KeyringTypes.qr, accounts: ['0xeee1'] },
      ]);
      const callOrder: string[] = [];
      mockKeyringController.createNewVaultAndRestore.mockImplementation(
        async () => {
          await Promise.resolve();
          callOrder.push('createNewVaultAndRestore');
        },
      );
      mockKeyringController.restoreQRKeyring.mockImplementation(async () => {
        callOrder.push('restoreQRKeyring');
      });
      mockLedgerKeyring.deserialize.mockImplementation(async () => {
        callOrder.push('restoreLedgerKeyring');
      });

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1');

      expect(mockKeyringController.withKeyring).toHaveBeenCalledWith(
        { type: KeyringTypes.ledger },
        expect.any(Function),
      );
      expect(mockKeyringController.withKeyring).toHaveBeenCalledWith(
        { type: KeyringTypes.qr },
        expect.any(Function),
      );
      expect(mockKeyringController.restoreQRKeyring).toHaveBeenCalledWith(
        `serialized-${KeyringTypes.qr}`,
      );
      expect(mockLedgerKeyring.deserialize).toHaveBeenCalledWith(
        `serialized-${KeyringTypes.ledger}`,
      );
      expect(callOrder).toEqual([
        'createNewVaultAndRestore',
        'restoreQRKeyring',
        'restoreLedgerKeyring',
      ]);
    });

    it('restores only the QR keyring when no Ledger keyring is present', async () => {
      setKeyrings([
        { type: KeyringTypes.hd, accounts: ['0xaaa1'] },
        { type: KeyringTypes.qr, accounts: ['0xeee1'] },
      ]);

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1');

      expect(mockKeyringController.withKeyring).toHaveBeenCalledTimes(1);
      expect(mockKeyringController.restoreQRKeyring).toHaveBeenCalledWith(
        `serialized-${KeyringTypes.qr}`,
      );
      expect(mockWithLedgerKeyring).not.toHaveBeenCalled();
    });

    it('does not serialize or restore hardware keyrings when none are present', async () => {
      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, '0xaaa1');

      expect(mockKeyringController.withKeyring).not.toHaveBeenCalled();
      expect(mockKeyringController.restoreQRKeyring).not.toHaveBeenCalled();
      expect(mockWithLedgerKeyring).not.toHaveBeenCalled();
    });

    it('reselects a checksummed address that matches a lowercased recreated account', async () => {
      const checksummedAddress = '0xAbCdEf0000000000000000000000000000000001';
      const lowercasedAddress = checksummedAddress.toLowerCase();
      setKeyrings([
        { type: KeyringTypes.hd, accounts: ['0xaaa1'] },
        { type: KeyringTypes.simple, accounts: [lowercasedAddress] },
      ]);
      mockKeyringController.createNewVaultAndRestore.mockImplementation(
        async () => {
          setKeyrings([{ type: KeyringTypes.hd, accounts: ['0xaaa1'] }]);
        },
      );
      mockKeyringController.importAccountWithStrategy.mockImplementation(
        async () => {
          mockKeyringController.state.keyrings.push({
            type: KeyringTypes.simple,
            accounts: [lowercasedAddress],
          });
        },
      );

      await recreateVaultWithNewPassword(
        PASSWORD,
        NEW_PASSWORD,
        checksummedAddress,
      );

      expect(mockSetSelectedAddress).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedAddress).toHaveBeenCalledWith(checksummedAddress);
    });

    it('does not reselect an address that is missing from the recreated keyrings', async () => {
      const droppedAddress = '0x0000000000000000000000000000000000000999';
      setKeyrings([
        { type: KeyringTypes.hd, accounts: ['0xaaa1'] },
        { type: KeyringTypes.ledger, accounts: [droppedAddress] },
      ]);
      mockWithLedgerKeyring.mockResolvedValue(undefined);
      mockKeyringController.createNewVaultAndRestore.mockImplementation(
        async () => {
          setKeyrings([{ type: KeyringTypes.hd, accounts: ['0xaaa1'] }]);
        },
      );

      await recreateVaultWithNewPassword(
        PASSWORD,
        NEW_PASSWORD,
        droppedAddress,
      );

      expect(mockSetSelectedAddress).not.toHaveBeenCalled();
    });

    it('rejects before recreating the vault when the seed phrase cannot be exported', async () => {
      const error = new Error('Invalid password');
      mockKeyringController.exportSeedPhrase.mockRejectedValue(error);

      await expect(
        recreateVaultWithNewPassword('wrong-password', NEW_PASSWORD, '0xaaa1'),
      ).rejects.toThrow('Invalid password');

      expect(mockKeyringController.exportAccount).not.toHaveBeenCalled();
      expect(
        mockKeyringController.createNewVaultAndRestore,
      ).not.toHaveBeenCalled();
      expect(mockKeyringController.addNewAccount).not.toHaveBeenCalled();
      expect(mockSetSelectedAddress).not.toHaveBeenCalled();
    });
  });

  describe('recreateVaultWithSamePassword', () => {
    beforeEach(() => {
      mockKeyringController.exportSeedPhrase.mockResolvedValue('seed');
      mockKeyringController.exportAccount.mockImplementation(
        async (_password: string, address: string) => `pk-${address}`,
      );
      mockKeyringController.state.keyrings = [
        { type: KeyringTypes.hd, accounts: ['0xaaa1'] },
        { type: KeyringTypes.simple, accounts: ['0xbbb1'] },
      ];
    });

    it('uses the same password to export and to recreate the vault', async () => {
      await recreateVaultWithSamePassword('my-password', '0xaaa1');

      expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledWith(
        'my-password',
      );
      expect(mockKeyringController.exportAccount).toHaveBeenCalledWith(
        'my-password',
        '0xbbb1',
      );
      expect(
        mockKeyringController.createNewVaultAndRestore,
      ).toHaveBeenCalledWith('my-password', 'seed');
      expect(mockSetSelectedAddress).toHaveBeenCalledWith('0xaaa1');
    });

    it('defaults to an empty password', async () => {
      await recreateVaultWithSamePassword(undefined, '0xaaa1');

      expect(mockKeyringController.exportSeedPhrase).toHaveBeenCalledWith('');
      expect(
        mockKeyringController.createNewVaultAndRestore,
      ).toHaveBeenCalledWith('', 'seed');
    });
  });
});

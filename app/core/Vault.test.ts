import Logger from '../util/Logger';
import Engine from './Engine';
import { withLedgerKeyring } from './Ledger/Ledger';

import { KeyringTypes } from '@metamask/keyring-controller';
import {
  getSeedPhrase,
  recreateVaultWithNewPassword,
  recreateVaultWithSamePassword,
  restoreLedgerKeyring,
  restoreQRKeyring,
} from './Vault';

interface MockKeyring {
  type: string;
  accounts: string[];
}

const mockKeyringState: { keyrings: MockKeyring[] } = { keyrings: [] };

jest.mock('./Engine', () => ({
  context: {
    KeyringController: {
      get state() {
        return mockKeyringState;
      },
      restoreQRKeyring: jest.fn(),
      withKeyring: jest.fn(),
      exportSeedPhrase: jest.fn(),
      exportAccount: jest.fn(),
      createNewVaultAndRestore: jest.fn(),
      addNewAccount: jest.fn(),
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

const PASSWORD = 'current-password';
const NEW_PASSWORD = 'new-password';
const SEED = new Uint8Array([1, 2, 3, 4]);

describe('Vault', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockKeyringState.keyrings = [];
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

  describe('getSeedPhrase', () => {
    it('exports the seed phrase with the given password', async () => {
      const { KeyringController } = MockEngine.context;
      KeyringController.exportSeedPhrase.mockResolvedValue(SEED);

      expect(await getSeedPhrase(PASSWORD)).toBe(SEED);
      expect(KeyringController.exportSeedPhrase).toHaveBeenCalledWith(PASSWORD);
    });

    it('defaults to an empty password', async () => {
      await getSeedPhrase();

      expect(
        MockEngine.context.KeyringController.exportSeedPhrase,
      ).toHaveBeenCalledWith('');
    });
  });

  describe('recreateVaultWithNewPassword', () => {
    const hdAccounts = [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333',
    ];
    const hdKeyring = (accounts = hdAccounts): MockKeyring => ({
      type: KeyringTypes.hd,
      accounts,
    });
    const privateKeyFor = (address: string) => `pk-${address}`;
    const mockWithKeyringSerialize = () => {
      const { withKeyring } = MockEngine.context.KeyringController;
      withKeyring.mockImplementation(async (selector, operation) => {
        const { type } = selector as { type: string };
        return operation({
          // @ts-expect-error Simplified keyring for testing
          keyring: { serialize: async () => `serialized-${type}` },
          metadata: { id: type, name: '' },
        });
      });
    };

    beforeEach(() => {
      const { KeyringController } = MockEngine.context;
      mockKeyringState.keyrings = [hdKeyring()];
      KeyringController.exportSeedPhrase.mockResolvedValue(SEED);
      KeyringController.exportAccount.mockImplementation(
        async (_password: string, address: string) => privateKeyFor(address),
      );
      KeyringController.restoreQRKeyring.mockResolvedValue(undefined);
      mockWithLedgerKeyring.mockResolvedValue(undefined);
    });

    it('recreates the vault from the seed phrase and re-derives all HD accounts', async () => {
      const { KeyringController } = MockEngine.context;

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      expect(KeyringController.exportSeedPhrase).toHaveBeenCalledWith(PASSWORD);
      expect(KeyringController.createNewVaultAndRestore).toHaveBeenCalledTimes(
        1,
      );
      expect(KeyringController.createNewVaultAndRestore).toHaveBeenCalledWith(
        NEW_PASSWORD,
        SEED,
      );
      expect(KeyringController.addNewAccount).toHaveBeenCalledTimes(2);
      expect(
        KeyringController.importAccountWithStrategy,
      ).not.toHaveBeenCalled();
    });

    it('re-derives accounts only after the vault has been recreated', async () => {
      const { KeyringController } = MockEngine.context;

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      const createOrder =
        KeyringController.createNewVaultAndRestore.mock.invocationCallOrder[0];
      for (const order of KeyringController.addNewAccount.mock
        .invocationCallOrder) {
        expect(order).toBeGreaterThan(createOrder);
      }
    });

    it('waits for the vault to be recreated before restoring accounts', async () => {
      const { KeyringController } = MockEngine.context;
      let resolveCreate: () => void = () => undefined;
      KeyringController.createNewVaultAndRestore.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        }),
      );
      mockWithKeyringSerialize();
      mockKeyringState.keyrings = [
        hdKeyring(),
        {
          type: KeyringTypes.simple,
          accounts: ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
        },
        {
          type: KeyringTypes.qr,
          accounts: ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
        },
      ];

      const recreatePromise = recreateVaultWithNewPassword(
        PASSWORD,
        NEW_PASSWORD,
        hdAccounts[0],
      );
      await new Promise(process.nextTick);

      expect(KeyringController.createNewVaultAndRestore).toHaveBeenCalled();
      expect(KeyringController.restoreQRKeyring).not.toHaveBeenCalled();
      expect(KeyringController.addNewAccount).not.toHaveBeenCalled();
      expect(
        KeyringController.importAccountWithStrategy,
      ).not.toHaveBeenCalled();

      resolveCreate();
      await recreatePromise;

      expect(KeyringController.restoreQRKeyring).toHaveBeenCalled();
      expect(KeyringController.addNewAccount).toHaveBeenCalledTimes(2);
      expect(KeyringController.importAccountWithStrategy).toHaveBeenCalled();
    });

    it('does not add accounts when the HD keyring has a single account', async () => {
      mockKeyringState.keyrings = [hdKeyring([hdAccounts[0]])];

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      expect(
        MockEngine.context.KeyringController.addNewAccount,
      ).not.toHaveBeenCalled();
    });

    it('exports and re-imports every account of every simple keyring', async () => {
      const { KeyringController } = MockEngine.context;
      const importedA = [
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      ];
      const importedB = ['0xcccccccccccccccccccccccccccccccccccccccc'];
      mockKeyringState.keyrings = [
        hdKeyring(),
        { type: KeyringTypes.simple, accounts: importedA },
        { type: KeyringTypes.simple, accounts: importedB },
      ];

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      const allImported = [...importedA, ...importedB];
      expect(KeyringController.exportAccount).toHaveBeenCalledTimes(3);
      allImported.forEach((address) =>
        expect(KeyringController.exportAccount).toHaveBeenCalledWith(
          PASSWORD,
          address,
        ),
      );
      expect(KeyringController.importAccountWithStrategy.mock.calls).toEqual(
        allImported.map((address) => ['privateKey', [privateKeyFor(address)]]),
      );
      const createOrder =
        KeyringController.createNewVaultAndRestore.mock.invocationCallOrder[0];
      expect(
        KeyringController.importAccountWithStrategy.mock.invocationCallOrder[0],
      ).toBeGreaterThan(createOrder);
      // HD account count comes from the HD keyring only
      expect(KeyringController.addNewAccount).toHaveBeenCalledTimes(2);
    });

    // Documents current behaviour: a failed export is logged and the vault is
    // still recreated, so the imported accounts are dropped.
    it('logs and skips re-import when exporting an imported account fails', async () => {
      const { KeyringController } = MockEngine.context;
      const error = new Error('export failed');
      mockKeyringState.keyrings = [
        hdKeyring(),
        {
          type: KeyringTypes.simple,
          accounts: ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
        },
      ];
      KeyringController.exportAccount.mockRejectedValue(error);

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'error while trying to get imported accounts on recreate vault',
      );
      expect(KeyringController.createNewVaultAndRestore).toHaveBeenCalledWith(
        NEW_PASSWORD,
        SEED,
      );
      expect(
        KeyringController.importAccountWithStrategy,
      ).not.toHaveBeenCalled();
    });

    // Documents current behaviour: the import loop stops at the first failure.
    it('logs and stops importing at the first failed re-import', async () => {
      const { KeyringController } = MockEngine.context;
      const error = new Error('import failed');
      const imported = [
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        '0xcccccccccccccccccccccccccccccccccccccccc',
      ];
      mockKeyringState.keyrings = [
        hdKeyring(),
        { type: KeyringTypes.simple, accounts: imported },
      ];
      KeyringController.importAccountWithStrategy
        .mockResolvedValueOnce(imported[0])
        .mockRejectedValueOnce(error);

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      expect(KeyringController.importAccountWithStrategy).toHaveBeenCalledTimes(
        2,
      );
      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'error while trying to import accounts on recreate vault',
      );
    });

    it('serializes and restores Ledger and QR keyrings when present', async () => {
      const { KeyringController } = MockEngine.context;
      const mockLedgerKeyring = { deserialize: jest.fn() };
      mockWithLedgerKeyring.mockImplementation(
        // @ts-expect-error The Ledger keyring is not compatible with our keyring type yet
        (operation) => operation(mockLedgerKeyring),
      );
      mockWithKeyringSerialize();
      mockKeyringState.keyrings = [
        hdKeyring(),
        {
          type: KeyringTypes.ledger,
          accounts: ['0xdddddddddddddddddddddddddddddddddddddddd'],
        },
        {
          type: KeyringTypes.qr,
          accounts: ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
        },
      ];

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      expect(KeyringController.withKeyring).toHaveBeenCalledWith(
        { type: KeyringTypes.ledger },
        expect.any(Function),
      );
      expect(KeyringController.withKeyring).toHaveBeenCalledWith(
        { type: KeyringTypes.qr },
        expect.any(Function),
      );
      expect(KeyringController.restoreQRKeyring).toHaveBeenCalledWith(
        `serialized-${KeyringTypes.qr}`,
      );
      expect(mockLedgerKeyring.deserialize).toHaveBeenCalledWith(
        `serialized-${KeyringTypes.ledger}`,
      );
      const createOrder =
        KeyringController.createNewVaultAndRestore.mock.invocationCallOrder[0];
      expect(
        KeyringController.withKeyring.mock.invocationCallOrder[1],
      ).toBeLessThan(createOrder);
      expect(
        KeyringController.restoreQRKeyring.mock.invocationCallOrder[0],
      ).toBeGreaterThan(createOrder);
      expect(mockWithLedgerKeyring.mock.invocationCallOrder[0]).toBeGreaterThan(
        createOrder,
      );
    });

    it('does not touch hardware keyrings when none are present', async () => {
      const { KeyringController } = MockEngine.context;

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      expect(KeyringController.withKeyring).not.toHaveBeenCalled();
      expect(KeyringController.restoreQRKeyring).not.toHaveBeenCalled();
      expect(mockWithLedgerKeyring).not.toHaveBeenCalled();
    });

    it('restores only the hardware keyring type that is present', async () => {
      const { KeyringController } = MockEngine.context;
      mockWithKeyringSerialize();
      mockKeyringState.keyrings = [
        hdKeyring(),
        {
          type: KeyringTypes.qr,
          accounts: ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
        },
      ];

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, hdAccounts[0]);

      expect(KeyringController.withKeyring).toHaveBeenCalledTimes(1);
      expect(KeyringController.restoreQRKeyring).toHaveBeenCalledWith(
        `serialized-${KeyringTypes.qr}`,
      );
      expect(mockWithLedgerKeyring).not.toHaveBeenCalled();
    });

    it('reselects a checksummed address that matches a lowercase account', async () => {
      const checksummed = '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01';
      mockKeyringState.keyrings = [
        hdKeyring([hdAccounts[0], checksummed.toLowerCase()]),
      ];

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, checksummed);

      expect(MockEngine.setSelectedAddress).toHaveBeenCalledTimes(1);
      expect(MockEngine.setSelectedAddress).toHaveBeenCalledWith(checksummed);
    });

    it('checks the recreated keyrings when reselecting the account', async () => {
      const { KeyringController } = MockEngine.context;
      const imported = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      mockKeyringState.keyrings = [
        hdKeyring(),
        { type: KeyringTypes.simple, accounts: [imported] },
      ];
      // The recreated vault no longer contains the imported account
      KeyringController.createNewVaultAndRestore.mockImplementation(
        async () => {
          mockKeyringState.keyrings = [hdKeyring([hdAccounts[0]])];
        },
      );

      await recreateVaultWithNewPassword(PASSWORD, NEW_PASSWORD, imported);

      expect(MockEngine.setSelectedAddress).not.toHaveBeenCalled();
    });

    it('does not reselect an address that is not in any keyring', async () => {
      await recreateVaultWithNewPassword(
        PASSWORD,
        NEW_PASSWORD,
        '0x9999999999999999999999999999999999999999',
      );

      expect(MockEngine.setSelectedAddress).not.toHaveBeenCalled();
    });

    it('rejects before recreating the vault when the password is wrong', async () => {
      const { KeyringController } = MockEngine.context;
      const error = new Error('Invalid password');
      KeyringController.exportSeedPhrase.mockRejectedValue(error);

      await expect(
        recreateVaultWithNewPassword('wrong', NEW_PASSWORD, hdAccounts[0]),
      ).rejects.toThrow(error);

      expect(KeyringController.createNewVaultAndRestore).not.toHaveBeenCalled();
      expect(KeyringController.addNewAccount).not.toHaveBeenCalled();
      expect(
        KeyringController.importAccountWithStrategy,
      ).not.toHaveBeenCalled();
      expect(MockEngine.setSelectedAddress).not.toHaveBeenCalled();
    });
  });

  describe('recreateVaultWithSamePassword', () => {
    beforeEach(() => {
      mockKeyringState.keyrings = [
        {
          type: KeyringTypes.hd,
          accounts: ['0x1111111111111111111111111111111111111111'],
        },
      ];
      MockEngine.context.KeyringController.exportSeedPhrase.mockResolvedValue(
        SEED,
      );
    });

    it('uses the same password to export and to recreate the vault', async () => {
      const { KeyringController } = MockEngine.context;

      await recreateVaultWithSamePassword(
        PASSWORD,
        '0x1111111111111111111111111111111111111111',
      );

      expect(KeyringController.exportSeedPhrase).toHaveBeenCalledWith(PASSWORD);
      expect(KeyringController.createNewVaultAndRestore).toHaveBeenCalledWith(
        PASSWORD,
        SEED,
      );
      expect(MockEngine.setSelectedAddress).toHaveBeenCalledWith(
        '0x1111111111111111111111111111111111111111',
      );
    });

    it('defaults to an empty password', async () => {
      const { KeyringController } = MockEngine.context;

      await recreateVaultWithSamePassword(
        undefined,
        '0x1111111111111111111111111111111111111111',
      );

      expect(KeyringController.exportSeedPhrase).toHaveBeenCalledWith('');
      expect(KeyringController.createNewVaultAndRestore).toHaveBeenCalledWith(
        '',
        SEED,
      );
    });
  });
});

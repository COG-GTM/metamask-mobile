import Logger from '../util/Logger';
import Engine from './Engine';
import { withLedgerKeyring } from './Ledger/Ledger';

import {
  restoreLedgerKeyring,
  restoreQRKeyring,
  getSeedPhrase,
} from './Vault';

jest.mock('./Engine', () => ({
  context: {
    KeyringController: {
      restoreQRKeyring: jest.fn(),
      withKeyring: jest.fn(),
      exportSeedPhrase: jest.fn(),
    },
  },
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
  describe('getSeedPhrase', () => {
    it('exports the seed phrase using the password it is given', async () => {
      const { KeyringController } = MockEngine.context;
      const mockSeed = new Uint8Array([1, 2, 3]);
      KeyringController.exportSeedPhrase.mockResolvedValue(mockSeed);

      const result = await getSeedPhrase('user-password');

      expect(KeyringController.exportSeedPhrase).toHaveBeenCalledWith(
        'user-password',
      );
      expect(result).toBe(mockSeed);
    });

    // Security regression: the empty-password export path must only succeed in
    // the pre-password onboarding state. Once a real password is configured,
    // KeyringController.exportSeedPhrase verifies the password first and throws
    // on an empty/incorrect one, so getSeedPhrase('') cannot reveal the SRP.
    it('rejects an empty-password export once a password has been set', async () => {
      const { KeyringController } = MockEngine.context;
      const SET_PASSWORD = 'user-password';
      KeyringController.exportSeedPhrase.mockImplementation(
        async (password: string) => {
          if (password !== SET_PASSWORD) {
            throw new Error('Incorrect password');
          }
          return new Uint8Array([1, 2, 3]);
        },
      );

      // Default empty password (and an explicit '') are rejected.
      await expect(getSeedPhrase()).rejects.toThrow('Incorrect password');
      await expect(getSeedPhrase('')).rejects.toThrow('Incorrect password');
      expect(KeyringController.exportSeedPhrase).toHaveBeenCalledWith('');

      // The correct password still exports, so legitimate flows are intact.
      await expect(getSeedPhrase(SET_PASSWORD)).resolves.toBeInstanceOf(
        Uint8Array,
      );
    });
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
});

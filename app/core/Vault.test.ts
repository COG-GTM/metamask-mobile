import { Messenger } from '@metamask/base-controller';
import {
  KeyringController as RealKeyringController,
  KeyringControllerActions,
  KeyringControllerEvents,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import Logger from '../util/Logger';
import Engine from './Engine';
import { withLedgerKeyring } from './Ledger/Ledger';

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
    const OLD_PASSWORD = 'old-password-123';
    const NEW_PASSWORD = 'new-password-456';
    const PRIMARY_SRP =
      'test test test test test test test test test test test ball';
    const SECONDARY_SRP =
      'legal winner thank year wave sausage worth useful legal winner thank yellow';
    const IMPORTED_PRIVATE_KEY =
      '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318';

    let originalKeyringController: unknown;

    // Plaintext stand-in for browser-passworder (no WebCrypto in Jest).
    const mockEncryptor = {
      encrypt: async (password: string, data: unknown) =>
        JSON.stringify({ password, data }),
      decrypt: async (password: string, vault: string) => {
        const parsed = JSON.parse(vault);
        if (parsed.password !== password) {
          throw new Error('Incorrect password');
        }
        return parsed.data;
      },
    };

    const setUpWallet = async () => {
      const messenger = new Messenger<
        KeyringControllerActions,
        KeyringControllerEvents
      >();
      const keyringController = new RealKeyringController({
        encryptor: mockEncryptor,
        messenger: messenger.getRestricted({
          name: 'KeyringController',
          allowedActions: [],
          allowedEvents: [],
        }),
      });
      await keyringController.createNewVaultAndRestore(
        OLD_PASSWORD,
        Buffer.from(PRIMARY_SRP, 'utf8'),
      );
      await keyringController.addNewAccount();
      const secondary = await keyringController.addNewKeyring(KeyringTypes.hd, {
        mnemonic: SECONDARY_SRP,
        numberOfAccounts: 1,
      });
      await keyringController.withKeyring(
        { id: secondary.id },
        async ({ keyring }) => keyring.addAccounts(1),
      );
      await keyringController.importAccountWithStrategy('privateKey' as never, [
        IMPORTED_PRIVATE_KEY,
      ]);
      // @ts-expect-error Swap the mocked controller for a real one
      MockEngine.context.KeyringController = keyringController;
      return keyringController;
    };

    const accountsByType = (keyringController: RealKeyringController) =>
      keyringController.state.keyrings.map(({ type, accounts }) => ({
        type,
        accounts,
      }));

    const decodeMnemonic = (mnemonic: Uint8Array) =>
      Array.from(
        new Uint16Array(
          mnemonic.buffer,
          mnemonic.byteOffset,
          mnemonic.byteLength / 2,
        ),
        (index) => wordlist[index],
      ).join(' ');

    beforeEach(() => {
      originalKeyringController = MockEngine.context.KeyringController;
    });

    afterEach(() => {
      // @ts-expect-error Restore the mocked controller
      MockEngine.context.KeyringController = originalKeyringController;
    });

    it('keeps every HD keyring, its accounts and imported accounts after a password change', async () => {
      const keyringController = await setUpWallet();
      const before = accountsByType(keyringController);
      const [, secondaryAccount] = before[1].accounts;
      const secondaryMetadata = keyringController.state.keyringsMetadata[1];
      const secondaryMnemonic = await keyringController.exportSeedPhrase(
        OLD_PASSWORD,
        secondaryMetadata.id,
      );
      const secondaryPrivateKey = await keyringController.exportAccount(
        OLD_PASSWORD,
        secondaryAccount,
      );

      await recreateVaultWithNewPassword(
        OLD_PASSWORD,
        NEW_PASSWORD,
        secondaryAccount,
      );

      const after = accountsByType(keyringController);
      expect(
        after.filter(({ type }) => type === KeyringTypes.hd),
      ).toStrictEqual(before.filter(({ type }) => type === KeyringTypes.hd));
      expect(
        after.find(({ type }) => type === KeyringTypes.simple)?.accounts,
      ).toStrictEqual(
        before.find(({ type }) => type === KeyringTypes.simple)?.accounts,
      );

      const newSecondaryId = keyringController.state.keyringsMetadata[1].id;
      expect(
        decodeMnemonic(
          await keyringController.exportSeedPhrase(
            NEW_PASSWORD,
            newSecondaryId,
          ),
        ),
      ).toBe(SECONDARY_SRP);
      expect(decodeMnemonic(secondaryMnemonic)).toBe(SECONDARY_SRP);
      expect(
        await keyringController.exportAccount(NEW_PASSWORD, secondaryAccount),
      ).toBe(secondaryPrivateKey);
      await expect(
        keyringController.verifyPassword(OLD_PASSWORD),
      ).rejects.toThrow();
      expect(MockEngine.setSelectedAddress).toHaveBeenCalledWith(
        secondaryAccount,
      );
    });

    it('leaves the vault untouched when the current password is wrong', async () => {
      const keyringController = await setUpWallet();
      const before = accountsByType(keyringController);
      const vaultBefore = keyringController.state.vault;

      await expect(
        recreateVaultWithNewPassword(
          'wrong-password',
          NEW_PASSWORD,
          before[0].accounts[0],
        ),
      ).rejects.toThrow();

      expect(accountsByType(keyringController)).toStrictEqual(before);
      expect(keyringController.state.vault).toBe(vaultBefore);
    });
  });
});

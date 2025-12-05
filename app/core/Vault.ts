import {
  AccountImportStrategy,
  KeyringControllerState,
  KeyringTypes,
} from '@metamask/keyring-controller';
import Engine from './Engine';
import Logger from '../util/Logger';
import { withLedgerKeyring } from './Ledger/Ledger';

/**
 * Restore the given serialized QR keyring.
 *
 * @param serializedQrKeyring - A serialized QR keyring.
 */
export const restoreQRKeyring = async (
  serializedQrKeyring: unknown,
): Promise<void> => {
  const { KeyringController } = Engine.context;

  try {
    await KeyringController.restoreQRKeyring(serializedQrKeyring);
  } catch (e) {
    Logger.error(e as Error, 'error while trying to get qr accounts on recreate vault');
  }
};

/**
 * Restore the given serialized Ledger keyring.
 *
 * @param serializedLedgerKeyring - A serialized Ledger keyring.
 */
export const restoreLedgerKeyring = async (
  serializedLedgerKeyring: unknown,
): Promise<void> => {
  try {
    await withLedgerKeyring(async (selected) => {
      // Handle both the actual API shape ({ keyring, metadata }) and legacy/test shape (keyring directly)
      // The test mocks pass the keyring directly, while the real API passes { keyring, metadata }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedAny = selected as any;
      const keyring = selectedAny.keyring ?? selectedAny;
      await keyring.deserialize(
        serializedLedgerKeyring as Parameters<typeof selected.keyring.deserialize>[0],
      );
    });
  } catch (e) {
    Logger.error(
      e as Error,
      'error while trying to restore Ledger accounts on recreate vault',
    );
  }
};

/**
 * Returns current vault seed phrase
 * It does it using an empty password or a password set by the user
 * depending on the state the app is currently in
 *
 * @param password - The password to use for exporting the seed phrase.
 * @returns The seed phrase.
 */
export const getSeedPhrase = async (password = ''): Promise<Uint8Array> => {
  const { KeyringController } = Engine.context;
  return await KeyringController.exportSeedPhrase(password);
};

/**
 * Recreates a vault with the new password
 *
 * @param password - current password
 * @param newPassword - new password
 * @param selectedAddress - the currently selected address
 */
export const recreateVaultWithNewPassword = async (
  password: string,
  newPassword: string,
  selectedAddress: string,
): Promise<void> => {
  const { KeyringController } = Engine.context;
  const seedPhrase = await getSeedPhrase(password);

  let importedAccounts: string[] = [];
  try {
    // Get imported accounts
    const simpleKeyrings = KeyringController.state.keyrings.filter(
      (keyring) => keyring.type === KeyringTypes.simple,
    );
    for (const simpleKeyring of simpleKeyrings) {
      const simpleKeyringAccounts = await Promise.all(
        simpleKeyring.accounts.map((account) =>
          KeyringController.exportAccount(password, account),
        ),
      );
      importedAccounts = [...importedAccounts, ...simpleKeyringAccounts];
    }
  } catch (e) {
    Logger.error(
      e as Error,
      'error while trying to get imported accounts on recreate vault',
    );
  }

  // Get props to restore vault
  const hdKeyring = KeyringController.state.keyrings[0];
  const existingAccountCount = hdKeyring.accounts.length;

  const serializedLedgerKeyring = hasKeyringType(
    KeyringController.state,
    KeyringTypes.ledger,
  )
    ? await getSerializedKeyring(KeyringTypes.ledger)
    : undefined;
  const serializedQrKeyring = hasKeyringType(
    KeyringController.state,
    KeyringTypes.qr,
  )
    ? await getSerializedKeyring(KeyringTypes.qr)
    : undefined;

  // Recreate keyring with password given to this method
  await KeyringController.createNewVaultAndRestore(newPassword, seedPhrase);

  if (serializedQrKeyring !== undefined) {
    await restoreQRKeyring(serializedQrKeyring);
  }
  if (serializedLedgerKeyring !== undefined) {
    await restoreLedgerKeyring(serializedLedgerKeyring);
  }

  // Create previous accounts again
  for (let i = 0; i < existingAccountCount - 1; i++) {
    await KeyringController.addNewAccount();
  }

  try {
    // Import imported accounts again
    for (const importedAccount of importedAccounts) {
      await KeyringController.importAccountWithStrategy(
        AccountImportStrategy.privateKey,
        [importedAccount],
      );
    }
  } catch (e) {
    Logger.error(e as Error, 'error while trying to import accounts on recreate vault');
  }
  const recreatedKeyrings = KeyringController.state.keyrings;
  // Reselect previous selected account if still available
  for (const keyring of recreatedKeyrings) {
    if (keyring.accounts.includes(selectedAddress.toLowerCase())) {
      Engine.setSelectedAddress(selectedAddress);
      return;
    }
  }
};

/**
 * Recreates a vault with the same password for the purpose of using the newest encryption methods
 *
 * @param selectedAddress - the currently selected address
 * @param password - Password to recreate and set the vault with
 */
export const recreateVaultWithSamePassword = async (
  selectedAddress: string,
  password = '',
): Promise<void> => recreateVaultWithNewPassword(password, password, selectedAddress);

/**
 * Checks whether the given keyring type exists in the given state.
 *
 * @param state - The KeyringController state.
 * @param type - The keyring type to check for.
 * @returns Whether the type was found in state.
 */
function hasKeyringType(
  state: KeyringControllerState,
  type: KeyringTypes,
): boolean {
  return state?.keyrings?.some((keyring) => keyring.type === type);
}

/**
 * Get the serialized state from the first keyring found of the given type.
 *
 * @param type - The type of keyring to serialize.
 * @returns The serialized state for the first keyring found of the given type.
 */
async function getSerializedKeyring(type: KeyringTypes): Promise<unknown> {
  const { KeyringController } = Engine.context;
  return await KeyringController.withKeyring({ type }, ({ keyring }) =>
    keyring.serialize(),
  );
}

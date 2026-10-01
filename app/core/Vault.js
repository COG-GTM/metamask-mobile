import Engine from './Engine';
import Logger from '../util/Logger';
import { KeyringTypes } from '@metamask/keyring-controller';
import { withLedgerKeyring } from './Ledger/Ledger';

/**
 * Restore the given serialized QR keyring.
 *
 * @param {unknown} serializedQrKeyring - A serialized QR keyring.
 */
export const restoreQRKeyring = async (serializedQrKeyring) => {
  const { KeyringController } = Engine.context;

  try {
    await KeyringController.restoreQRKeyring(serializedQrKeyring);
  } catch (e) {
    Logger.error(e, 'error while trying to get qr accounts on recreate vault');
  }
};

/**
 * Restore the given serialized Ledger keyring.
 *
 * @param {unknown} serializedLedgerKeyring - A serialized Ledger keyring.
 */
export const restoreLedgerKeyring = async (serializedLedgerKeyring) => {
  try {
    await withLedgerKeyring(async (keyring) => {
      await keyring.deserialize(serializedLedgerKeyring);
    });
  } catch (e) {
    Logger.error(
      e,
      'error while trying to restore Ledger accounts on recreate vault',
    );
  }
};

/**
 * Returns current vault seed phrase.
 *
 * The default empty-string password only succeeds while the vault is still
 * encrypted with an empty password, i.e. the pre-password onboarding state
 * (`ChoosePassword` exports with `''` only while
 * `keyringControllerPasswordSet === false`). Once a real password has been
 * set, this empty password cannot be used to export secrets: the underlying
 * `KeyringController.exportSeedPhrase` calls `verifyPassword(password)` first
 * and throws on a wrong/empty password, so the SRP is never returned.
 *
 * @param password - The keyring password. Defaults to `''` for the
 * pre-password onboarding state; callers that already have a password set
 * must pass it explicitly.
 */
export const getSeedPhrase = async (password = '') => {
  const { KeyringController } = Engine.context;
  return await KeyringController.exportSeedPhrase(password);
};

/**
 * Recreates a vault with the new password
 *
 * @param password - current password
 * @param newPassword - new password
 * @param selectedAddress
 */
export const recreateVaultWithNewPassword = async (
  password,
  newPassword,
  selectedAddress,
) => {
  const { KeyringController } = Engine.context;
  const seedPhrase = await getSeedPhrase(password);

  let importedAccounts = [];
  try {
    // Get imported accounts
    const simpleKeyrings = KeyringController.state.keyrings.filter(
      (keyring) => keyring.type === KeyringTypes.simple,
    );
    for (let i = 0; i < simpleKeyrings.length; i++) {
      const simpleKeyring = simpleKeyrings[i];
      const simpleKeyringAccounts = await Promise.all(
        simpleKeyring.accounts.map((account) =>
          KeyringController.exportAccount(password, account),
        ),
      );
      importedAccounts = [...importedAccounts, ...simpleKeyringAccounts];
    }
  } catch (e) {
    Logger.error(
      e,
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
    for (let i = 0; i < importedAccounts.length; i++) {
      await KeyringController.importAccountWithStrategy('privateKey', [
        importedAccounts[i],
      ]);
    }
  } catch (e) {
    Logger.error(e, 'error while trying to import accounts on recreate vault');
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
 * The default empty-string password is only valid in the pre-password
 * onboarding state (vault still encrypted with `''`); once a password is set
 * it must be passed explicitly. `getSeedPhrase`/`exportAccount` run through
 * `KeyringController.verifyPassword`, so an empty password cannot export
 * secrets after a real password has been configured.
 *
 * @param password - Password to recreate and set the vault with
 */
export const recreateVaultWithSamePassword = async (
  password = '',
  selectedAddress,
) => recreateVaultWithNewPassword(password, password, selectedAddress);

/**
 * Checks whether the given keyring type exists in the given state.
 *
 * @param {KeyringControllerState} state - The KeyringController state.
 * @param {KeyringTypes} type - The keyring type to check for.
 * @returns Whether the type was found in state.
 */
function hasKeyringType(state, type) {
  return state?.keyrings?.some((keyring) => keyring.type === type);
}

/**
 * Get the serialized state from the first keyring found of the given type.
 *
 * @param {KeyringTypes} type - The type of keyring to serialize.
 * @returns The serialized state for the first keyring found of the given type.
 */
async function getSerializedKeyring(type) {
  const { KeyringController } = Engine.context;
  return await KeyringController.withKeyring({ type }, ({ keyring }) =>
    keyring.serialize(),
  );
}

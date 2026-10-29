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
 * Returns current vault seed phrase
 * It does it using an empty password or a password set by the user
 * depending on the state the app is currently in
 */
export const getSeedPhrase = async (password = '') => {
  const { KeyringController } = Engine.context;
  return await KeyringController.exportSeedPhrase(password);
};

/**
 * Exports the mnemonic and account count of every HD keyring in the vault,
 * primary keyring first.
 *
 * @param password - current password
 * @returns {Promise<{ mnemonic: Uint8Array, numberOfAccounts: number }[]>}
 */
const getHdKeyringsToRestore = async (password) => {
  const { KeyringController } = Engine.context;
  const { keyrings, keyringsMetadata } = KeyringController.state;

  if (keyrings[0]?.type !== KeyringTypes.hd) {
    throw new Error('Primary keyring is not an HD keyring');
  }

  const hdKeyrings = [];
  for (let i = 0; i < keyrings.length; i++) {
    if (keyrings[i].type !== KeyringTypes.hd) continue;
    const keyringId = keyringsMetadata?.[i]?.id;
    if (i > 0 && !keyringId) {
      throw new Error('Missing metadata for HD keyring');
    }
    const mnemonic = await KeyringController.exportSeedPhrase(
      password,
      keyringId,
    );
    hdKeyrings.push({
      mnemonic,
      numberOfAccounts: keyrings[i].accounts.length,
    });
  }
  return hdKeyrings;
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
  const [primaryHdKeyring, ...secondaryHdKeyrings] =
    await getHdKeyringsToRestore(password);

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
  await KeyringController.createNewVaultAndRestore(
    newPassword,
    primaryHdKeyring.mnemonic,
  );

  if (serializedQrKeyring !== undefined) {
    await restoreQRKeyring(serializedQrKeyring);
  }
  if (serializedLedgerKeyring !== undefined) {
    await restoreLedgerKeyring(serializedLedgerKeyring);
  }

  // Create previous accounts again
  for (let i = 0; i < primaryHdKeyring.numberOfAccounts - 1; i++) {
    await KeyringController.addNewAccount();
  }

  // Restore every additional Secret Recovery Phrase with its accounts
  for (const { mnemonic, numberOfAccounts } of secondaryHdKeyrings) {
    await KeyringController.addNewKeyring(KeyringTypes.hd, {
      mnemonic,
      numberOfAccounts,
    });
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

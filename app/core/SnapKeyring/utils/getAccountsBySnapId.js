///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)


import Engine from '../../../core/Engine';

/**
 * Get the addresses of the accounts managed by a given Snap.
 *
 * @param snapId - Snap ID to get accounts for.
 * @returns The addresses of the accounts.
 */
export const getAccountsBySnapId = async (snapId) => {
  const snapKeyring =
  await Engine.getSnapKeyring();
  return await snapKeyring.getAccountsBySnapId(snapId);
};
///: END:ONLY_INCLUDE_IF
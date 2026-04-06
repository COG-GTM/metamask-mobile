import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 * Migrates the address book from a flat address-keyed structure
 * to a chainId-keyed structure.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 0: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 0: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 0: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  if (
    !isObject(state.engine.backgroundState.AddressBookController) ||
    !hasProperty(state.engine.backgroundState.AddressBookController, 'addressBook') ||
    !isObject(state.engine.backgroundState.AddressBookController.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 0: Invalid AddressBookController state`,
      ),
    );
    return state;
  }

  const addressBook = state.engine.backgroundState.AddressBookController
    .addressBook as Record<string, { chainId: number | string; [key: string]: unknown }>;
  const migratedAddressBook: Record<string, Record<string, { chainId: number | string; [key: string]: unknown }>> = {};

  Object.keys(addressBook).forEach((address) => {
    const chainId = addressBook[address].chainId.toString();
    migratedAddressBook[chainId]
      ? (migratedAddressBook[chainId] = {
          ...migratedAddressBook[chainId],
          [address]: addressBook[address],
        })
      : (migratedAddressBook[chainId] = { [address]: addressBook[address] });
  });
  state.engine.backgroundState.AddressBookController.addressBook =
    migratedAddressBook;
  return state;
}

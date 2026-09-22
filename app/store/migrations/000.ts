import { hasProperty, isObject } from '@metamask/utils';
import { ensureValidState } from './util';

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  if (!ensureValidState(state, 0)) {
    return state;
  }

  const addressBookControllerState =
    state.engine.backgroundState.AddressBookController;

  if (
    !isObject(addressBookControllerState) ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    return state;
  }

  const { addressBook } = addressBookControllerState;
  const migratedAddressBook: Record<string, Record<string, unknown>> = {};

  for (const [address, addressEntry] of Object.entries(addressBook)) {
    if (!isObject(addressEntry) || !hasProperty(addressEntry, 'chainId')) {
      continue;
    }
    const chainId = String(addressEntry.chainId);
    migratedAddressBook[chainId] = {
      ...migratedAddressBook[chainId],
      [address]: addressEntry,
    };
  }

  addressBookControllerState.addressBook = migratedAddressBook;

  return state;
}

import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  if (!ensureValidState(state, 0)) {
    return state;
  }

  const addressBookController =
    state.engine.backgroundState.AddressBookController;
  if (
    !isObject(addressBookController) ||
    !isObject(addressBookController.addressBook)
  ) {
    return state;
  }

  const addressBook = addressBookController.addressBook;
  const migratedAddressBook: Record<string, Record<string, unknown>> = {};
  Object.keys(addressBook).forEach((address) => {
    const entry = addressBook[address];
    if (!isObject(entry)) {
      return;
    }
    const chainId = String(entry.chainId);
    migratedAddressBook[chainId] = {
      ...migratedAddressBook[chainId],
      [address]: entry,
    };
  });
  addressBookController.addressBook = migratedAddressBook;
  return state;
}

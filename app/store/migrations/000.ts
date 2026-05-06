import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

interface AddressBookEntry {
  chainId: number | string;
  [key: string]: unknown;
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 0: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const addressBookController = state.engine.backgroundState
    .AddressBookController;
  if (
    !isObject(addressBookController) ||
    !hasProperty(addressBookController, 'addressBook') ||
    !isObject(addressBookController.addressBook)
  ) {
    return state;
  }

  const addressBook = addressBookController.addressBook as Record<
    string,
    AddressBookEntry
  >;
  const migratedAddressBook: Record<string, Record<string, AddressBookEntry>> =
    {};
  Object.keys(addressBook).forEach((address) => {
    const chainId = addressBook[address].chainId.toString();
    migratedAddressBook[chainId]
      ? (migratedAddressBook[chainId] = {
          ...migratedAddressBook[chainId],
          [address]: addressBook[address],
        })
      : (migratedAddressBook[chainId] = { [address]: addressBook[address] });
  });
  addressBookController.addressBook = migratedAddressBook;
  return state;
}

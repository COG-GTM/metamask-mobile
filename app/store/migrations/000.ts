import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

interface AddressBookEntry {
  chainId: string | number;
  [key: string]: unknown;
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.AddressBookController)
  ) {
    captureException(
      new Error(
        `Migration 0: Invalid state structure for AddressBookController migration`,
      ),
    );
    return state;
  }

  const addressBookController = state.engine.backgroundState
    .AddressBookController as { addressBook: Record<string, AddressBookEntry> };
  const addressBook = addressBookController.addressBook;
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
  (
    state.engine.backgroundState.AddressBookController as Record<
      string,
      unknown
    >
  ).addressBook = migratedAddressBook;
  return state;
}

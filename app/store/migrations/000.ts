import { isObject } from '@metamask/utils';

interface AddressBookEntry {
  chainId: string | number;
  [key: string]: unknown;
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const addressBookController = engineState.backgroundState.AddressBookController as Record<string, unknown> | undefined;
  if (!addressBookController?.addressBook) {
    return state;
  }

  const addressBook = addressBookController.addressBook as Record<string, AddressBookEntry>;
  const migratedAddressBook: Record<string, Record<string, AddressBookEntry>> = {};

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

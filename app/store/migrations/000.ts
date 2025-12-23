import { isObject, hasProperty } from '@metamask/utils';

interface AddressBookEntry {
  chainId: number | string;
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

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const addressBookControllerState = state.engine.backgroundState.AddressBookController;
  if (!isObject(addressBookControllerState) || !hasProperty(addressBookControllerState, 'addressBook')) {
    return state;
  }

  const addressBook = addressBookControllerState.addressBook as Record<string, AddressBookEntry>;
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
  addressBookControllerState.addressBook =
    migratedAddressBook as unknown as Record<string, AddressBookEntry>;
  return state;
}

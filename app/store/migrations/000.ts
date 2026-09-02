import { hasProperty, isObject } from '@metamask/utils';
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
    !isObject(state.engine.backgroundState.AddressBookController) ||
    !hasProperty(
      state.engine.backgroundState.AddressBookController,
      'addressBook',
    ) ||
    !isObject(state.engine.backgroundState.AddressBookController.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 0: Invalid AddressBookController addressBook state: '${typeof state}'`,
      ),
    );
    return state;
  }

  const addressBook = state.engine.backgroundState.AddressBookController
    .addressBook as Record<string, AddressBookEntry>;
  const migratedAddressBook: Record<
    string,
    Record<string, AddressBookEntry>
  > = {};
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

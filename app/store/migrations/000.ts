import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
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
    !hasProperty(addressBookControllerState, 'addressBook') ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 0: Invalid AddressBookController state: '${typeof addressBookControllerState}'`,
      ),
    );
    return state;
  }

  const { addressBook } = addressBookControllerState;
  const migratedAddressBook: Record<string, Record<string, unknown>> = {};
  Object.keys(addressBook).forEach((address) => {
    const entry = addressBook[address];
    if (!isObject(entry) || !hasProperty(entry, 'chainId')) {
      return;
    }
    const chainId = String(entry.chainId);
    migratedAddressBook[chainId] = {
      ...(migratedAddressBook[chainId] ?? {}),
      [address]: entry,
    };
  });
  addressBookControllerState.addressBook = migratedAddressBook;
  return state;
}

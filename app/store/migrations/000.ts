import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

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
  if (!isObject(state.engine)) {
    captureException(
      new Error(`Migration 0: Invalid engine state: '${typeof state.engine}'`),
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
  if (!isObject(state.engine.backgroundState.AddressBookController)) {
    captureException(
      new Error(
        `Migration 0: Invalid AddressBookController state: '${typeof state
          .engine.backgroundState.AddressBookController}'`,
      ),
    );
    return state;
  }

  const addressBook = state.engine.backgroundState.AddressBookController
    .addressBook as Record<string, Record<string, unknown>>;
  const migratedAddressBook: Record<
    string,
    Record<string, Record<string, unknown>>
  > = {};
  Object.keys(addressBook).forEach((address) => {
    const chainId = String(addressBook[address].chainId);
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

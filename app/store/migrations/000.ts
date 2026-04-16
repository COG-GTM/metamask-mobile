import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 000: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 000: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (
    !isObject(backgroundState.AddressBookController) ||
    !hasProperty(
      backgroundState.AddressBookController as Record<string, unknown>,
      'addressBook',
    ) ||
    !isObject(
      (backgroundState.AddressBookController as Record<string, unknown>)
        .addressBook,
    )
  ) {
    captureException(
      new Error(`Migration 000: Invalid AddressBookController state`),
    );
    return state;
  }

  const addressBookController = backgroundState.AddressBookController as Record<
    string,
    unknown
  >;
  const addressBook = addressBookController.addressBook as Record<
    string,
    Record<string, unknown>
  >;
  const migratedAddressBook: Record<
    string,
    Record<string, Record<string, unknown>>
  > = {};
  Object.keys(addressBook).forEach((address) => {
    const entry = addressBook[address];
    if (isObject(entry) && hasProperty(entry, 'chainId')) {
      const chainId = String(entry.chainId);
      migratedAddressBook[chainId]
        ? (migratedAddressBook[chainId] = {
            ...migratedAddressBook[chainId],
            [address]: entry,
          })
        : (migratedAddressBook[chainId] = { [address]: entry });
    }
  });
  addressBookController.addressBook = migratedAddressBook;
  return state;
}

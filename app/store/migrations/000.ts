import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 000: Invalid root state: '${typeof state}'`),
    );
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  if (
    !isObject(backgroundState.AddressBookController) ||
    !hasProperty(backgroundState.AddressBookController, 'addressBook') ||
    !isObject(backgroundState.AddressBookController.addressBook)
  ) {
    return state as Record<string, unknown>;
  }

  const addressBook = backgroundState.AddressBookController.addressBook as Record<string, Record<string, unknown>>;
  const migratedAddressBook: Record<string, Record<string, unknown>> = {};
  Object.keys(addressBook).forEach((address) => {
    const entry = addressBook[address] as Record<string, unknown>;
    const chainId = String(entry.chainId);
    migratedAddressBook[chainId]
      ? (migratedAddressBook[chainId] = {
          ...migratedAddressBook[chainId],
          [address]: addressBook[address],
        })
      : (migratedAddressBook[chainId] = { [address]: addressBook[address] });
  });
  (backgroundState.AddressBookController as Record<string, unknown>).addressBook =
    migratedAddressBook;
  return state as Record<string, unknown>;
}

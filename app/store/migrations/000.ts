import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 0: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  const addressBook =
    typedState.engine.backgroundState.AddressBookController.addressBook;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migratedAddressBook: Record<string, any> = {};
  Object.keys(addressBook).forEach((address: string) => {
    const chainId = addressBook[address].chainId.toString();
    migratedAddressBook[chainId]
      ? (migratedAddressBook[chainId] = {
          ...migratedAddressBook[chainId],
          [address]: addressBook[address],
        })
      : (migratedAddressBook[chainId] = { [address]: addressBook[address] });
  });
  typedState.engine.backgroundState.AddressBookController.addressBook =
    migratedAddressBook;
  return typedState;
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
import type { MigrationState } from './migration-types';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  const addressBook =
    state.engine.backgroundState.AddressBookController.addressBook;
  const migratedAddressBook: Record<string, MigrationState> = {};
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

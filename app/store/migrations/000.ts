/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
/* eslint-disable @typescript-eslint/no-explicit-any */
// Legacy persisted state is expected to contain engine.backgroundState.
export default function migrate(state: unknown): Record<string, unknown>;
export default function migrate(state: any) {
  const addressBook =
    state.engine.backgroundState.AddressBookController.addressBook;
  const migratedAddressBook: Record<string, any> = {};
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

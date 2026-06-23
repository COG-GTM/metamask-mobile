/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/

interface AddressBookEntry {
  chainId: number | string;
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: state.engine.backgroundState.AddressBookController.addressBook
  // is a flat map keyed by address; this migration regroups it by chainId.
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
  const addressBook = backgroundState.AddressBookController
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
  backgroundState.AddressBookController.addressBook = migratedAddressBook;
  return state as Record<string, unknown>;
}

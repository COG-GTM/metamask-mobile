interface LegacyAddressBookEntry {
  chainId: string | number;
  [key: string]: unknown;
}
type LegacyAddressBook = Record<string, LegacyAddressBookEntry>;

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(untypedState: unknown) {
  const state = untypedState as {
    engine: {
      backgroundState: { AddressBookController: { addressBook: unknown } };
    };
  };
  const addressBook = state.engine.backgroundState.AddressBookController
    .addressBook as LegacyAddressBook;
  const migratedAddressBook: Record<string, LegacyAddressBook> = {};
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

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
interface AddressBookEntry {
  chainId: string | number;
  [key: string]: unknown;
}

export default function migrate(state: unknown): unknown {
  const typedState = state as {
    engine: {
      backgroundState: {
        AddressBookController: { addressBook: unknown };
      };
    };
  };
  const addressBook = typedState.engine.backgroundState.AddressBookController
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
  typedState.engine.backgroundState.AddressBookController.addressBook =
    migratedAddressBook;
  return state;
}

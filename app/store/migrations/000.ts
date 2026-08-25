interface AddressBookEntry {
  chainId: string | number;
}

interface Migration000State {
  engine: {
    backgroundState: {
      AddressBookController: {
        // Keyed by address before this migration, by chain ID afterwards
        addressBook: Record<string, unknown>;
      };
    };
  };
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration000State;
  const addressBook = state.engine.backgroundState.AddressBookController
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
  state.engine.backgroundState.AddressBookController.addressBook =
    migratedAddressBook;
  return state;
}

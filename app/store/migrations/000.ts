interface AddressBookEntry {
  chainId: string | number;
  [key: string]: unknown;
}

interface Migration000State {
  engine: {
    backgroundState: {
      AddressBookController: {
        addressBook: Record<string, unknown>;
      };
    };
  };
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  const migratedState = state as Migration000State;
  const addressBook = migratedState.engine.backgroundState.AddressBookController
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
  migratedState.engine.backgroundState.AddressBookController.addressBook =
    migratedAddressBook;
  return migratedState;
}

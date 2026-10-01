interface AddressBookEntry {
  chainId: number | string;
}

interface Migration0State {
  engine: {
    backgroundState: {
      AddressBookController: {
        addressBook: Record<string, AddressBookEntry>;
      };
    };
  };
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  const typedState = state as Migration0State;
  const addressBook =
    typedState.engine.backgroundState.AddressBookController.addressBook;
  const migratedAddressBook: Record<string, Record<string, AddressBookEntry>> =
    {};
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
    migratedAddressBook as unknown as Record<string, AddressBookEntry>;
  return typedState;
}

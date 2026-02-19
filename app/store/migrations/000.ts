interface AddressBookEntry {
  chainId: { toString(): string };
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      AddressBookController: {
        addressBook: Record<string, AddressBookEntry>;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const addressBook =
    s.engine.backgroundState.AddressBookController.addressBook;
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
  (
    s.engine.backgroundState.AddressBookController as Record<string, unknown>
  ).addressBook = migratedAddressBook;
  return state;
}

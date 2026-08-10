/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
interface AddressBookEntry {
  chainId: string | number;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      AddressBookController: {
        addressBook: Record<string, unknown>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const addressBookController =
    migratedState.engine.backgroundState.AddressBookController;
  const addressBook = addressBookController.addressBook as Record<
    string,
    AddressBookEntry
  >;
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
  addressBookController.addressBook = migratedAddressBook;
  return migratedState;
}

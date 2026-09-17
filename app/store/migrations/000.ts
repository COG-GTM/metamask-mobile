interface AddressBookEntry {
  chainId: string | number;
}

type LegacyAddressBook = Record<string, AddressBookEntry>;
type MigratedAddressBook = Record<string, LegacyAddressBook>;

interface MigrationState {
  engine: {
    backgroundState: {
      AddressBookController: {
        addressBook: LegacyAddressBook | MigratedAddressBook;
      };
    };
  };
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  const addressBookController = (state as MigrationState).engine.backgroundState
    .AddressBookController;
  const addressBook = addressBookController.addressBook as LegacyAddressBook;
  const migratedAddressBook: MigratedAddressBook = {};
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
  return state;
}

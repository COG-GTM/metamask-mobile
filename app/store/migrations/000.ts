interface AddressBookEntry {
  chainId: string | number;
}

/** The address book after being re-keyed by chain ID. */
type MigratedAddressBook = Record<string, Record<string, AddressBookEntry>>;

/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      AddressBookController: {
        addressBook: Record<string, AddressBookEntry> | MigratedAddressBook;
      };
    };
  };
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown): Record<string, unknown> {
  const addressBookControllerState = (state as MigrationState).engine
    .backgroundState.AddressBookController;
  const addressBook = addressBookControllerState.addressBook as Record<
    string,
    AddressBookEntry
  >;
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
  addressBookControllerState.addressBook = migratedAddressBook;
  return state as Record<string, unknown>;
}

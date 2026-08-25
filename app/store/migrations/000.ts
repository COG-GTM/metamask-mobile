/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/

interface AddressBookEntry {
  chainId: string | number;
  [key: string]: unknown;
}

/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      AddressBookController: {
        addressBook: Record<string, AddressBookEntry>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const addressBook =
    migratedState.engine.backgroundState.AddressBookController.addressBook;
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
    migratedAddressBook as unknown as Record<string, AddressBookEntry>;
  return migratedState;
}

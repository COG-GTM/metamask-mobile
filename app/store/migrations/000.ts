type AddressBook = Record<string, { chainId: { toString(): string } }>;

interface MigrationState {
  engine: {
    backgroundState: {
      AddressBookController: {
        addressBook: AddressBook | Record<string, AddressBook>;
      };
    };
  };
}

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const addressBook = typedState.engine.backgroundState.AddressBookController
    .addressBook as AddressBook;
  const migratedAddressBook: Record<string, AddressBook> = {};
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
  return typedState;
}

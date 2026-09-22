interface AddressBookEntry {
  chainId?: string | number | bigint;
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

/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const addressBook =
    typedState.engine.backgroundState.AddressBookController.addressBook;
  const migratedAddressBook: Record<
    string,
    Record<string, AddressBookEntry>
  > = {};
  Object.keys(addressBook).forEach((address) => {
    const chainId = (
      (addressBook[address] as AddressBookEntry).chainId as
        | string
        | number
        | bigint
    ).toString();
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

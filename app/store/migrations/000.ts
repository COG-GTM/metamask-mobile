/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown): Record<string, unknown> {
  // The legacy address book state structure prior to this migration.
  const typedState = state as {
    engine: {
      backgroundState: {
        AddressBookController: {
          addressBook: Record<
            string,
            { chainId: { toString: () => string } } & Record<string, unknown>
          >;
        };
      };
    };
  };

  const addressBook =
    typedState.engine.backgroundState.AddressBookController.addressBook;
  const migratedAddressBook: Record<
    string,
    Record<string, (typeof addressBook)[string]>
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
  typedState.engine.backgroundState.AddressBookController.addressBook =
    migratedAddressBook as unknown as typeof addressBook;
  return state as Record<string, unknown>;
}

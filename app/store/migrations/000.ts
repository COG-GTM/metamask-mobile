/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        AddressBookController: { addressBook: Record<string, unknown> };
      };
    };
  };
  const addressBook = typedState.engine.backgroundState.AddressBookController
    .addressBook as Record<string, { chainId: number | string }>;
  const migratedAddressBook: Record<
    string,
    Record<string, { chainId: number | string }>
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
    migratedAddressBook;
  return typedState;
}

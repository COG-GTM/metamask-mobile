/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: { AddressBookController: { addressBook: Record<string, { chainId: { toString(): string } }> } } };
  };
  const addressBook = s.engine.backgroundState.AddressBookController.addressBook;
  const migratedAddressBook: Record<string, Record<string, unknown>> = {};
  Object.keys(addressBook).forEach((address) => {
    const chainId = addressBook[address].chainId.toString();
    migratedAddressBook[chainId]
      ? (migratedAddressBook[chainId] = {
          ...migratedAddressBook[chainId],
          [address]: addressBook[address],
        })
      : (migratedAddressBook[chainId] = { [address]: addressBook[address] });
  });
  s.engine.backgroundState.AddressBookController.addressBook =
    migratedAddressBook;
  return state;
}

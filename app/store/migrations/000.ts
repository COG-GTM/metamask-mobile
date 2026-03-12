/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  const addressBook =
    s.engine.backgroundState.AddressBookController.addressBook;
  const migratedAddressBook: Record<string, any> = {};
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
  return s;
}

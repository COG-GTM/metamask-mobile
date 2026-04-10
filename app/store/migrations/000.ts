/**
 * Needed after https://github.com/MetaMask/controllers/pull/152
 *
 **/
export default function migrate(state: unknown) {
  const typedState = state as Record<string, unknown>;
  const engineState = typedState.engine as Record<string, unknown>;
  const backgroundState = engineState.backgroundState as Record<
    string,
    unknown
  >;
  const addressBookController = backgroundState.AddressBookController as Record<
    string,
    unknown
  >;
  const addressBook = addressBookController.addressBook as Record<
    string,
    { chainId: number | string; [key: string]: unknown }
  >;
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
  addressBookController.addressBook = migratedAddressBook;
  return state;
}

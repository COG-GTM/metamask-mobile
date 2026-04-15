import { toChecksumAddress } from 'ethereumjs-util';
import { useSelector } from 'react-redux';

import { selectInternalAccounts } from '../../selectors/accountsController';
import { toLowerCaseEquals } from '../../util/general';

import { selectAddressBook } from '../../selectors/addressBookController';
import { selectIsEvmNetworkSelected } from '../../selectors/multichainNetworkController';
import { selectEvmChainId } from '../../selectors/networkController';



const useExistingAddress = (address) => {
  const chainId = useSelector(selectEvmChainId);
  const isEvmSelected = useSelector(selectIsEvmNetworkSelected);

  const addressBook = useSelector(selectAddressBook);
  const internalAccounts = useSelector(selectInternalAccounts);

  if (!address || !isEvmSelected) return;
  // TODO: [SOLANA] Revisit this before shipping, Address Book controller should support non evm networks
  const networkAddressBook = addressBook[chainId] || {};
  const checksummedAddress = toChecksumAddress(address);

  const matchingAddressBookEntry =
  networkAddressBook?.[checksummedAddress];

  if (matchingAddressBookEntry) {
    return {
      name: matchingAddressBookEntry.name,
      address: matchingAddressBookEntry.address
    };
  }

  const accountWithMatchingAddress = internalAccounts.find((account) =>
  toLowerCaseEquals(account.address, address)
  );

  if (accountWithMatchingAddress) {
    return {
      address: accountWithMatchingAddress.address,
      name: accountWithMatchingAddress.metadata.name
    };
  }

  return undefined;
};

export default useExistingAddress;
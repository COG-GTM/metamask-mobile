import { AddressBookEntry } from '@metamask/address-book-controller';
import { Hex } from '@metamask/utils';

export interface AddressListProps {
  chainId: Hex;
  inputSearch?: string;
  onAccountPress: (address: string) => void;
  onAccountLongPress: (address: string) => void;
  onIconPress: () => void;
  onlyRenderAddressBook?: boolean;
  reloadAddressList?: boolean;
}

export interface Contact extends AddressBookEntry {
  isSmartContract?: boolean;
  isAmbiguousAddress?: boolean;
}

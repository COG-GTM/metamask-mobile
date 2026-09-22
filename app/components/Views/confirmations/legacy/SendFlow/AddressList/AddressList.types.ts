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

export interface Contact {
  address: string;
  name: string;
  chainId: Hex;
  isSmartContract?: boolean;
  isAmbiguousAddress?: boolean;
}

export type AddressListElement = string | Contact;

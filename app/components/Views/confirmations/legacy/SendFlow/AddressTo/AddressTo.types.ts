import { TextInput } from 'react-native';

export interface SFAddressToProps {
  addressToReady: boolean;
  confusableCollectionArray?: string[];
  highlighted: boolean;
  inputRef?: React.RefObject<TextInput>;
  inputWidth?: object;
  isFromAddressBook?: boolean;
  onSubmit: (address: string) => void;
  onToSelectedAddressChange: (address?: string) => void;
  toSelectedAddress?: string;
  toSelectedAddressName?: string;
  updateParentState?: (state: { highlighted: boolean }) => void;
}

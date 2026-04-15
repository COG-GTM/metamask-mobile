/* eslint-disable no-console */
/* eslint-disable import/prefer-default-export */
// External dependencies.
import { AvatarAccountType } from '../../Avatars/Avatar/variants/AvatarAccount';

// Internal dependencies.


// Sample consts
export const SAMPLE_PICKERACCOUNT_PROPS = {
  accountAddress: '0x2990079bcdEe240329a520d2444386FC119da21a',
  accountAvatarType: AvatarAccountType.JazzIcon,
  accountName: 'Orangefox.eth',
  onPress: () => console.log('PickerAccount pressed'),
  showAddress: false
};
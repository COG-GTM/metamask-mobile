/* eslint-disable import/prefer-default-export */
// External dependencies.
import { AvatarVariant, AvatarAccountType } from '../../Avatars/Avatar';


// Internal dependencies.


// Sample consts
const SAMPLE_CELL_TITLE = 'Orangefox.eth';
const SAMPLE_CELL_SECONDARYTEXT = '0x2990079bcdEe240329a520d2444386FC119da21a';
const SAMPLE_CELL_TERTIARY_TEXT = 'Updated 1 sec ago';
const SAMPLE_CELL_TAGLABEL = 'Imported';
const SAMPLE_CELL_AVATARPROPS = {
  variant: AvatarVariant.Account,
  accountAddress: '0x2990079bcdEe240329a520d2444386FC119da21a',
  type: AvatarAccountType.JazzIcon
};

export const SAMPLE_CELL_PROPS = {
  title: SAMPLE_CELL_TITLE,
  secondaryText: SAMPLE_CELL_SECONDARYTEXT,
  tertiaryText: SAMPLE_CELL_TERTIARY_TEXT,
  tagLabel: SAMPLE_CELL_TAGLABEL,
  avatarProps: SAMPLE_CELL_AVATARPROPS
};
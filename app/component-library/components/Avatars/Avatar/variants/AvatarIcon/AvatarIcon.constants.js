/* eslint-disable import/prefer-default-export */
// External dependencies.
import { mockTheme } from '../../../../../../util/theme';
import { AvatarSize } from '../../Avatar.types';
import { IconName, IconColor } from '../../../../Icons/Icon';

// Internal dependencies.


// Defaults
export const DEFAULT_AVATARICON_SIZE = AvatarSize.Md;

// Sample consts
export const SAMPLE_AVATARICON_PROPS = {
  size: AvatarSize.Md,
  name: IconName.AddSquare,
  iconColor: IconColor.Default,
  backgroundColor: mockTheme.colors.background.default
};
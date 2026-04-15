/* eslint-disable import/prefer-default-export */
// Third party dependences.


// External dependencies.
import { AvatarSize } from '../../Avatar.types';

// Internal dependencies.


// Defaults
export const DEFAULT_AVATARTOKEN_SIZE = AvatarSize.Md;
export const DEFAULT_AVATARTOKEN_ERROR_TEXT = '?';

// Test IDs
export const AVATARTOKEN_IMAGE_TESTID = 'token-avatar-image';

// Sample consts
/* eslint-disable-next-line */
export const SAMPLE_AVATARTOKEN_IMAGESOURCE_LOCAL = require('../../../../../../images/ethereum.png');
const SAMPLE_AVATARTOKEN_IMAGESOURCE_REMOTE = {
  uri: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
};

export const SAMPLE_AVATARTOKEN_PROPS = {
  size: DEFAULT_AVATARTOKEN_SIZE,
  name: 'Wrapped Ethereum',
  imageSource: SAMPLE_AVATARTOKEN_IMAGESOURCE_REMOTE,
  isIpfsGatewayCheckBypassed: true
};
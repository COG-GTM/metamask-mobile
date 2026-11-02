import { useSelector } from 'react-redux';
import {
  selectDisplayNftMedia,
  selectIsIpfsGatewayEnabled,
} from '../../../selectors/preferencesController';
import { isIPFSUri } from '../../general';

/**
 * Whether remote NFT media at `uri` may be fetched, mirroring CollectibleMedia:
 * allowed when Display NFT media is on, or when the media is on IPFS and the
 * IPFS gateway is enabled.
 */
export const shouldDisplayNftMedia = (
  uri: unknown,
  displayNftMedia: boolean,
  isIpfsGatewayEnabled: boolean,
): boolean => {
  if (typeof uri !== 'string' || uri.length === 0) {
    return false;
  }
  if (displayNftMedia) {
    return true;
  }
  return isIpfsGatewayEnabled && isIPFSUri(uri);
};

export const useShouldDisplayNftMedia = (uri: unknown): boolean => {
  const displayNftMedia = useSelector(selectDisplayNftMedia);
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);
  return shouldDisplayNftMedia(uri, displayNftMedia, isIpfsGatewayEnabled);
};

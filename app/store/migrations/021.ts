import { isObject } from '@metamask/utils';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';
import { ensureValidState } from './util';

const outdatedIpfsGateways = [
  'https://hardbin.com/ipfs/',
  'https://ipfs.greyh.at/ipfs/',
  'https://ipfs.fooock.com/ipfs/',
  'https://cdn.cwinfo.net/ipfs/',
];

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 21)) {
    return state;
  }

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;

  if (!isObject(preferencesControllerState)) {
    return state;
  }

  const isUsingOutdatedGateway =
    typeof preferencesControllerState.ipfsGateway === 'string' &&
    outdatedIpfsGateways.includes(preferencesControllerState.ipfsGateway);

  if (isUsingOutdatedGateway) {
    preferencesControllerState.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

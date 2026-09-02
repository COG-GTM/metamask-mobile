import { hasProperty, isObject } from '@metamask/utils';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  if (
    !isObject(state) ||
    !hasProperty(state, 'engine') ||
    !isObject(state.engine) ||
    !hasProperty(state.engine, 'backgroundState') ||
    !isObject(state.engine.backgroundState)
  ) {
    return state;
  }

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;

  if (
    isObject(preferencesControllerState) &&
    hasProperty(preferencesControllerState, 'ipfsGateway') &&
    typeof preferencesControllerState.ipfsGateway === 'string' &&
    outdatedIpfsGateways.includes(preferencesControllerState.ipfsGateway)
  ) {
    preferencesControllerState.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

import { isObject } from '@metamask/utils';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const preferencesControllerState = state.engine.backgroundState.PreferencesController as Record<string, unknown> | undefined;

  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    (preferencesControllerState?.ipfsGateway as string) || '',
  );

  if (isUsingOutdatedGateway && preferencesControllerState) {
    preferencesControllerState.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

import { isObject } from '@metamask/utils';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const preferencesController = engineState.backgroundState.PreferencesController as Record<string, unknown> | undefined;
  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    preferencesController?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway && preferencesController) {
    preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }

  return state;
}

import { isObject } from '@metamask/utils';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState)
  ) {
    return state;
  }

  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const preferencesController = state.engine.backgroundState
    .PreferencesController as
    | { ipfsGateway?: string; [key: string]: unknown }
    | undefined;

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    preferencesController?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway && preferencesController) {
    preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

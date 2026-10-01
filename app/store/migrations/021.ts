import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';
import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const preferencesController = backgroundState.PreferencesController as Record<string, unknown> | undefined;
  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    preferencesController?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway && preferencesController) {
    preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state as Record<string, unknown>;
}

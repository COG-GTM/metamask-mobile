import { isObject } from '@metamask/utils';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 21)) {
    return state;
  }

  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const preferencesController =
    state.engine.backgroundState.PreferencesController;
  const ipfsGateway = isObject(preferencesController)
    ? preferencesController.ipfsGateway
    : undefined;

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    ipfsGateway as string,
  );

  if (isObject(preferencesController) && isUsingOutdatedGateway) {
    preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

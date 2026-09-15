import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState?: {
      PreferencesController?: {
        ipfsGateway?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

export default function migrate(stateUnknown: unknown) {
  const state = stateUnknown as MigrationState;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const ipfsGateway =
    state.engine.backgroundState?.PreferencesController?.ipfsGateway;
  const isUsingOutdatedGateway =
    ipfsGateway !== undefined && outdatedIpfsGateways.includes(ipfsGateway);

  if (
    isUsingOutdatedGateway &&
    state.engine.backgroundState?.PreferencesController
  ) {
    state.engine.backgroundState.PreferencesController.ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

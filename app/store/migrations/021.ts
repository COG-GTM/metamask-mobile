import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState?: {
      PreferencesController?: {
        ipfsGateway?: string;
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const preferencesControllerState =
    state.engine.backgroundState?.PreferencesController;

  const isUsingOutdatedGateway =
    preferencesControllerState?.ipfsGateway !== undefined &&
    outdatedIpfsGateways.includes(preferencesControllerState.ipfsGateway);

  if (isUsingOutdatedGateway && preferencesControllerState) {
    preferencesControllerState.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

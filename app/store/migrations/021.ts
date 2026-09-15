import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface LegacyState {
  engine: {
    backgroundState?: {
      PreferencesController?: {
        ipfsGateway?: string;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const preferencesController =
    state.engine.backgroundState?.PreferencesController;
  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    preferencesController?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway && preferencesController) {
    preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

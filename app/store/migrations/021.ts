import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface State021 {
  engine: {
    backgroundState?: {
      PreferencesController?: {
        ipfsGateway?: string;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State021;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    typedState.engine.backgroundState?.PreferencesController?.ipfsGateway ?? '',
  );

  if (isUsingOutdatedGateway) {
    const preferencesController =
      typedState.engine.backgroundState?.PreferencesController;
    if (preferencesController) {
      preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
    }
  }
  return state;
}

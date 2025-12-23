import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface State {
  engine: {
    backgroundState?: {
      PreferencesController?: {
        ipfsGateway?: string;
      };
    };
  };
}

export default function migrate(state: State): State {
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    state.engine.backgroundState?.PreferencesController?.ipfsGateway || '',
  );

  if (isUsingOutdatedGateway && state.engine.backgroundState?.PreferencesController) {
    state.engine.backgroundState.PreferencesController.ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

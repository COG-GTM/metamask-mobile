import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface Migration21State {
  engine: {
    backgroundState: {
      PreferencesController: {
        ipfsGateway: string;
      };
    };
  };
}

export default function migrate(rawState: unknown) {
  const state = rawState as Migration21State;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    state.engine.backgroundState?.PreferencesController?.ipfsGateway,
  );

  if (isUsingOutdatedGateway) {
    state.engine.backgroundState.PreferencesController.ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

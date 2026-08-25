import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface Migration021State {
  engine: {
    backgroundState?: {
      PreferencesController?: {
        ipfsGateway?: string;
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration021State;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    state.engine.backgroundState?.PreferencesController
      ?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway) {
    (
      state.engine.backgroundState as {
        PreferencesController: { ipfsGateway?: string };
      }
    ).PreferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine?: {
      backgroundState?: {
        PreferencesController?: {
          ipfsGateway?: string;
        };
      };
    };
  };

  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const currentGateway =
    typedState.engine?.backgroundState?.PreferencesController?.ipfsGateway;
  const isUsingOutdatedGateway =
    typeof currentGateway === 'string' &&
    outdatedIpfsGateways.includes(currentGateway);

  if (
    isUsingOutdatedGateway &&
    typedState.engine?.backgroundState?.PreferencesController
  ) {
    typedState.engine.backgroundState.PreferencesController.ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return state as Record<string, unknown>;
}

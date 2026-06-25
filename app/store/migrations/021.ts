import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState?: {
        PreferencesController?: { ipfsGateway?: string };
      };
    };
  };
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    typedState.engine.backgroundState?.PreferencesController
      ?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway) {
    (
      typedState.engine.backgroundState as {
        PreferencesController: { ipfsGateway?: string };
      }
    ).PreferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return typedState;
}

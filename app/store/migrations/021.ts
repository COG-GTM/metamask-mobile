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

  const preferencesController =
    typedState.engine.backgroundState?.PreferencesController;
  const ipfsGateway = preferencesController?.ipfsGateway;
  const isUsingOutdatedGateway =
    ipfsGateway !== undefined && outdatedIpfsGateways.includes(ipfsGateway);

  if (isUsingOutdatedGateway && preferencesController) {
    preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return state as Record<string, unknown>;
}

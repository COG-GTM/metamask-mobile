import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController?: {
        ipfsGateway?: string;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    typedState.engine.backgroundState?.PreferencesController?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway) {
    if (typedState.engine.backgroundState.PreferencesController) {
      typedState.engine.backgroundState.PreferencesController.ipfsGateway =
        IPFS_DEFAULT_GATEWAY_URL;
    }
  }
  return typedState;
}

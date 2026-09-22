import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: {
        ipfsGateway: string;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    typedState.engine.backgroundState?.PreferencesController?.ipfsGateway,
  );

  if (isUsingOutdatedGateway) {
    typedState.engine.backgroundState.PreferencesController.ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return typedState;
}

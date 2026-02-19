import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: {
        ipfsGateway?: string;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    s.engine.backgroundState?.PreferencesController?.ipfsGateway ?? '',
  );

  if (isUsingOutdatedGateway) {
    s.engine.backgroundState.PreferencesController.ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return state;
}

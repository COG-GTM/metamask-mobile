import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState?: {
      PreferencesController?: { ipfsGateway?: string };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const outdatedIpfsGateways = [
    'https://hardbin.com/ipfs/',
    'https://ipfs.greyh.at/ipfs/',
    'https://ipfs.fooock.com/ipfs/',
    'https://cdn.cwinfo.net/ipfs/',
  ];

  const isUsingOutdatedGateway = outdatedIpfsGateways.includes(
    migratedState.engine.backgroundState?.PreferencesController
      ?.ipfsGateway as string,
  );

  if (isUsingOutdatedGateway) {
    (
      migratedState.engine.backgroundState as {
        PreferencesController: { ipfsGateway?: string };
      }
    ).PreferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return migratedState;
}

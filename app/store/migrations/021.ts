import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState?: {
      PreferencesController?: {
        ipfsGateway?: string;
        [key: string]: unknown;
      };
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

  const preferencesController =
    migratedState.engine.backgroundState?.PreferencesController;
  const ipfsGateway = preferencesController?.ipfsGateway;
  const isUsingOutdatedGateway =
    ipfsGateway !== undefined && outdatedIpfsGateways.includes(ipfsGateway);

  if (isUsingOutdatedGateway && preferencesController) {
    preferencesController.ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return migratedState;
}

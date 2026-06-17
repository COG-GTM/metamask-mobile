import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

interface PreferencesControllerState {
  ipfsGateway?: string;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController?: PreferencesControllerState;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
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
      typedState.engine.backgroundState
        .PreferencesController as PreferencesControllerState
    ).ipfsGateway = IPFS_DEFAULT_GATEWAY_URL;
  }
  return typedState as unknown as Record<string, unknown>;
}

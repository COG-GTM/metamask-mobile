import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

// Legacy persisted state shape expected by this migration
interface StateWithPreferences {
  engine: {
    backgroundState?: {
      PreferencesController?: {
        ipfsGateway?: string;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithPreferences;
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

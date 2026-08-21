import { IPFS_DEFAULT_GATEWAY_URL } from '../../../app/constants/network';

/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour. The optional chaining below
 * is kept because the properties may be absent at runtime.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: {
        ipfsGateway: string;
      };
    };
  };
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
    typedState.engine.backgroundState?.PreferencesController?.ipfsGateway,
  );

  if (isUsingOutdatedGateway) {
    typedState.engine.backgroundState.PreferencesController.ipfsGateway =
      IPFS_DEFAULT_GATEWAY_URL;
  }
  return state as Record<string, unknown>;
}

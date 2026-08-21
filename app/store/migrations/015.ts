// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error `NetworksChainId` was removed from `@metamask/controller-utils`.
// The import is preserved as-is so this migration keeps its current runtime behaviour.
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId?: string;
          ticker?: string;
          type?: string;
        };
      };
    };
  };
}

export default function migrate(state: unknown): Record<string, unknown> {
  const networkControllerState = (state as MigrationState).engine
    .backgroundState.NetworkController;
  const chainId = networkControllerState.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkControllerState.providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state as Record<string, unknown>;
}

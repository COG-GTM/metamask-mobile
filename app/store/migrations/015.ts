// @ts-expect-error NetworksChainId was removed from @metamask/controller-utils in a later version; retained to preserve the original migration behavior.
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId?: unknown;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      };
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  const chainId =
    typedState.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    typedState.engine.backgroundState.NetworkController.providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return typedState as unknown as Record<string, unknown>;
}

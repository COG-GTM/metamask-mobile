import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';

// Decimal chain ID for goerli at the time this migration ran.
// Replaces the deprecated `NetworksChainId` enum from `@metamask/controller-utils`.
const GOERLI_CHAIN_ID = '5';

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.NetworkController)
  ) {
    captureException(
      new Error(
        `Migration 15: Invalid state structure for NetworkController migration`,
      ),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as {
    providerConfig: { chainId?: string; ticker?: string; type?: string };
  };

  const chainId = networkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkController.providerConfig = {
      chainId: GOERLI_CHAIN_ID,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

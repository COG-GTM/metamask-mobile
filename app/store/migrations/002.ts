import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import AppConstants from '../../core/AppConstants';

// Re-implementation of the deprecated `isSafeChainId(chainId: number)` helper
// that used to live in `app/util/networks/index.js`. The replacement
// `isSafeChainId` exported from `@metamask/controller-utils` now expects a
// 0x-prefixed hex string, but this legacy migration historically passed a
// decimal number, so we preserve the original numeric-input semantics.
function isSafeChainId(chainId: number): boolean {
  return (
    Number.isSafeInteger(chainId) &&
    chainId > 0 &&
    chainId <= AppConstants.MAX_SAFE_CHAIN_ID
  );
}

interface Provider {
  type?: string;
  chainId?: string;
  ticker?: string;
  [key: string]: unknown;
}

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.NetworkController)
  ) {
    captureException(
      new Error(
        `Migration 2: Invalid state structure for NetworkController migration`,
      ),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as { provider: Provider };
  const provider = networkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId ?? '', 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}

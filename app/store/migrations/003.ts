import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';
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

// Decimal chain IDs of well-known networks at the time this migration ran.
// Replaces the deprecated `NetworksChainId` enum from `@metamask/controller-utils`.
const NETWORKS_CHAIN_ID: Record<string, string> = {
  mainnet: '1',
  ropsten: '3',
  rinkeby: '4',
  goerli: '5',
  kovan: '42',
  rpc: '',
  localhost: '',
};

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.NetworkController)
  ) {
    captureException(
      new Error(
        `Migration 3: Invalid state structure for NetworkController migration`,
      ),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as { provider: Provider };
  const provider = networkController.provider;
  const chainId = provider.type ? NETWORKS_CHAIN_ID[provider.type] : undefined;
  // if chainId === '' is a rpc
  if (chainId) {
    networkController.provider = {
      ...provider,
      chainId,
    };
    return state;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NETWORKS_CHAIN_ID.goerli,
    };
  }
  return state;
}

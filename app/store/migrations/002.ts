import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

/**
 * Maximum safe chain ID based on EIP-2294.
 * Previously imported from @metamask/controller-utils but since removed.
 */
const MAX_SAFE_CHAIN_ID = 4503599627370476;

function isSafeChainId(chainId: number): boolean {
  return (
    Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID
  );
}

/**
 * Switch to testnet if custom RPC has invalid chainId.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 2: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 2: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 2: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  if (
    !isObject(state.engine.backgroundState.NetworkController) ||
    !hasProperty(state.engine.backgroundState.NetworkController, 'provider') ||
    !isObject(state.engine.backgroundState.NetworkController.provider)
  ) {
    captureException(
      new Error(`Migration 2: Invalid NetworkController state`),
    );
    return state;
  }

  const provider = state.engine.backgroundState.NetworkController.provider as Record<string, unknown>;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    typeof provider.type === 'string' && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    state.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}

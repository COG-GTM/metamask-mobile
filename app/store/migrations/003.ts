import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

/**
 * Maximum safe chain ID based on EIP-2294.
 */
const MAX_SAFE_CHAIN_ID = 4503599627370476;

function isSafeChainId(chainId: number): boolean {
  return (
    Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID
  );
}

/**
 * Legacy mapping of network type names to their decimal chain IDs.
 * Previously exported as NetworksChainId from @metamask/controller-utils
 * but since removed.
 */
const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-sepolia': '59141',
  'linea-mainnet': '59144',
};

/**
 * Ensure NetworkController provider has a valid chainId.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 3: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 3: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 3: Invalid engine backgroundState: '${typeof state.engine
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
      new Error(`Migration 3: Invalid NetworkController state`),
    );
    return state;
  }

  const provider = state.engine.backgroundState.NetworkController.provider as Record<string, unknown>;
  const chainId = NetworksChainId[provider.type as string];

  // if chainId === '' is a rpc
  if (chainId) {
    state.engine.backgroundState.NetworkController.provider = {
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
    state.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state;
}

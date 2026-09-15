import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import AppConstants from '../../core/AppConstants';
import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { ensureValidState } from './util';

/**
 * Decimal chain IDs keyed by network type, as exported by
 * `@metamask/controller-utils` (`NetworksChainId`) at the time these early
 * migrations were written. Chain IDs were stored as decimal strings back then.
 */
export const LegacyNetworksChainId: Readonly<Record<string, string>> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
  localhost: '',
  rpc: '',
};

export const getLegacyChainIdForNetworkType = (
  networkType: string,
): string | undefined =>
  hasProperty(LegacyNetworksChainId, networkType)
    ? LegacyNetworksChainId[networkType]
    : undefined;

/**
 * Checks whether the given decimal chain ID is safe.
 *
 * @param chainId - The decimal chain ID to check for safety.
 * @returns Whether the given chain ID is safe.
 */
export const isSafeDecimalChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) &&
  chainId > 0 &&
  chainId <= AppConstants.MAX_SAFE_CHAIN_ID;

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 2)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;
  if (
    !isObject(networkControllerState) ||
    !hasProperty(networkControllerState, 'provider') ||
    !isObject(networkControllerState.provider)
  ) {
    captureException(
      new Error(
        `Migration 2: Invalid NetworkController state: '${typeof networkControllerState}'`,
      ),
    );
    return state;
  }

  const { provider } = networkControllerState;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    typeof provider.type === 'string' &&
    getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(String(provider.chainId), 10);
  const isCustomRpcWithInvalidChainId = !isSafeDecimalChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkControllerState.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}

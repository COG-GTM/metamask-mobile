/**
 * Mapping of built-in network type names to their decimal chain IDs.
 * Inlined because `NetworksChainId` was removed from `@metamask/controller-utils`.
 */
const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
  'linea-sepolia': '59141',
};
import { GOERLI } from '../../../app/constants/network';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 015: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 015: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.NetworkController)) {
    captureException(
      new Error(`Migration 015: Invalid NetworkController state`),
    );
    return state;
  }

  const networkController = backgroundState.NetworkController as Record<
    string,
    unknown
  >;

  if (!isObject(networkController.providerConfig)) {
    captureException(
      new Error(`Migration 015: Invalid providerConfig state`),
    );
    return state;
  }

  const providerConfig = networkController.providerConfig as Record<
    string,
    unknown
  >;
  const chainId = providerConfig.chainId as string;

  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkController.providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

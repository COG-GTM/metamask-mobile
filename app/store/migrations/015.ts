import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 015: Invalid root state: '${typeof state}'`),
    );
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  if (
    !isObject(backgroundState.NetworkController) ||
    !isObject((backgroundState.NetworkController as Record<string, unknown>).providerConfig)
  ) {
    return state as Record<string, unknown>;
  }

  const providerConfig = (backgroundState.NetworkController as Record<string, unknown>).providerConfig as Record<string, unknown>;
  const chainId = providerConfig.chainId as string;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    (backgroundState.NetworkController as Record<string, unknown>).providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state as Record<string, unknown>;
}

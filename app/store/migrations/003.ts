import { NetworksChainId } from '@metamask/controller-utils';
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 003: Invalid root state: '${typeof state}'`),
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
    !isObject((backgroundState.NetworkController as Record<string, unknown>).provider)
  ) {
    return state as Record<string, unknown>;
  }

  const provider = (backgroundState.NetworkController as Record<string, unknown>).provider as Record<string, unknown>;
  const chainId = (NetworksChainId as Record<string, string>)[provider.type as string];
  // if chainId === '' is a rpc
  if (chainId) {
    (backgroundState.NetworkController as Record<string, unknown>).provider = {
      ...provider,
      chainId,
    };
    return state as Record<string, unknown>;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    (backgroundState.NetworkController as Record<string, unknown>).provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state as Record<string, unknown>;
}

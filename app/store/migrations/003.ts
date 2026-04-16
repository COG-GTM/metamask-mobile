import { NetworksChainId } from '@metamask/controller-utils';
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 003: Invalid root state: '${typeof state}'`),
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
      new Error(`Migration 003: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.NetworkController)) {
    captureException(
      new Error(`Migration 003: Invalid NetworkController state`),
    );
    return state;
  }

  const networkController = backgroundState.NetworkController as Record<
    string,
    unknown
  >;

  if (!isObject(networkController.provider)) {
    captureException(
      new Error(`Migration 003: Invalid provider state`),
    );
    return state;
  }

  const provider = networkController.provider as Record<string, unknown>;
  const chainId =
    (NetworksChainId as Record<string, string>)[provider.type as string];
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
      chainId: NetworksChainId.goerli,
    };
  }
  return state;
}

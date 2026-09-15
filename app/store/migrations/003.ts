import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';
import { ensureValidState } from './util';
import {
  LegacyNetworksChainId,
  getLegacyChainIdForNetworkType,
  isSafeDecimalChainId,
} from './002';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 3)) {
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
        `Migration 3: Invalid NetworkController state: '${typeof networkControllerState}'`,
      ),
    );
    return state;
  }

  const { provider } = networkControllerState;
  const providerType = typeof provider.type === 'string' ? provider.type : '';
  const chainId = getLegacyChainIdForNetworkType(providerType);
  // if chainId === '' is a rpc
  if (chainId) {
    networkControllerState.provider = {
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
    !isDecimalString || !isSafeDecimalChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkControllerState.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: LegacyNetworksChainId.goerli,
    };
  }
  return state;
}

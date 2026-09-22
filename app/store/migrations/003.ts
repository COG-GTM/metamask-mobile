import { isObject } from '@metamask/utils';
import { isSafeChainId, toHex } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';
import { NETWORKS_CHAIN_ID } from './migration-data/networks-chain-id';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 3)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;

  if (
    !isObject(networkControllerState) ||
    !isObject(networkControllerState.provider)
  ) {
    return state;
  }

  const { provider } = networkControllerState;
  const chainId =
    typeof provider.type === 'string'
      ? NETWORKS_CHAIN_ID[provider.type as keyof typeof NETWORKS_CHAIN_ID]
      : undefined;
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
  const storedChainIdNumber = parseInt(storedChainId, 10);
  const hasInvalidChainId =
    !isDecimalString ||
    !Number.isSafeInteger(storedChainIdNumber) ||
    storedChainIdNumber <= 0 ||
    !isSafeChainId(toHex(storedChainIdNumber));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkControllerState.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NETWORKS_CHAIN_ID.goerli,
    };
  }
  return state;
}

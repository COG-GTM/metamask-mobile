import { isObject } from '@metamask/utils';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';
import { ensureValidState } from './util';
import { NetworksChainId, isSafeChainId } from './util/legacyNetworks';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 3)) {
    return state;
  }

  const networkController = state.engine.backgroundState.NetworkController;
  if (!isObject(networkController) || !isObject(networkController.provider)) {
    return state;
  }

  const provider = networkController.provider;
  const providerType =
    typeof provider.type === 'string' ? provider.type : '';
  const chainId = NetworksChainId[providerType];
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

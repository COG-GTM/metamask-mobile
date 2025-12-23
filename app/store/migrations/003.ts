import { isObject, hasProperty } from '@metamask/utils';
import { ChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

// Safe chain ID check - chain ID must be a positive integer less than MAX_SAFE_CHAIN_ID
const MAX_SAFE_CHAIN_ID = 4503599627370476;
const isSafeChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;

// Map of network types to chain IDs
const NetworksChainId: Record<string, string> = {
  mainnet: ChainId.mainnet,
  goerli: ChainId.goerli,
  sepolia: ChainId.sepolia,
  'linea-goerli': ChainId['linea-goerli'],
  'linea-sepolia': ChainId['linea-sepolia'],
  'linea-mainnet': ChainId['linea-mainnet'],
};

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;
  if (!isObject(networkControllerState)) {
    return state;
  }

  if (!hasProperty(networkControllerState, 'provider') || !isObject(networkControllerState.provider)) {
    return state;
  }

  const provider = networkControllerState.provider;
  const providerType = typeof provider.type === 'string' ? provider.type : '';
  const chainId = NetworksChainId[providerType];
  
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
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkControllerState.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: ChainId.goerli,
    };
  }
  return state;
}

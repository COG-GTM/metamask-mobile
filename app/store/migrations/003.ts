import { isObject } from '@metamask/utils';
import { isSafeChainId, toHex } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
  'linea-sepolia': '59141',
  localhost: '1337',
  rpc: '',
};

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const networkController = state.engine.backgroundState
    .NetworkController as Record<string, unknown> | undefined;
  if (!isObject(networkController)) return state;

  const provider = networkController.provider as Record<string, unknown> | undefined;
  if (!isObject(provider)) return state;

  const chainId =
    NetworksChainId[provider.type as string];
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
    !isDecimalString || !isSafeChainId(toHex(parseInt(storedChainId, 10)));

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

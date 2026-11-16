import AppConstants from '../../core/AppConstants';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

// Frozen decimal chain IDs from @metamask/controller-utils@3 (NetworksChainId),
// which no longer exports them. '' marks a custom RPC / localhost provider.
const NetworksChainId = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  localhost: '',
  rpc: '',
};

const isSafeChainId = (chainId) =>
  Number.isSafeInteger(chainId) &&
  chainId > 0 &&
  chainId <= AppConstants.MAX_SAFE_CHAIN_ID;

export default function migrate(state) {
  const provider = state.engine.backgroundState.NetworkController.provider;
  const chainId = NetworksChainId[provider.type];
  // if chainId === '' is a rpc
  if (chainId) {
    state.engine.backgroundState.NetworkController.provider = {
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
    state.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state;
}

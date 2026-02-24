import type { MigrationState } from './migration-types';
// NetworksChainId was removed from @metamask/controller-utils.
// Inline the historical mapping used by this migration.
const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
};
// isSafeChainId was removed from dependencies. Inline the historical logic.
const isSafeChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) && chainId > 0 && chainId <= 4503599627370476;
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
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

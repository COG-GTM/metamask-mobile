import { isSafeChainId } from '@metamask/controller-utils';
import {
  GOERLI,
  MAINNET,
  NETWORKS_CHAIN_ID,
  SEPOLIA,
} from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Legacy persisted state is expected to contain engine.backgroundState.
export default function migrate(state: unknown): Record<string, unknown>;
export default function migrate(state: any) {
  const NetworksChainId: Record<string, string> = {
    [MAINNET]: NETWORKS_CHAIN_ID.MAINNET,
    [GOERLI]: NETWORKS_CHAIN_ID.GOERLI,
    [SEPOLIA]: NETWORKS_CHAIN_ID.SEPOLIA,
  };
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
    !isDecimalString ||
    !isSafeChainId(
      parseInt(storedChainId, 10) as unknown as `0x${string}`,
    );

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

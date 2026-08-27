import { MAX_SAFE_CHAIN_ID } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

// Mirrors the historical `NetworksChainId` map (decimal chain IDs) that
// @metamask/controller-utils exported when this migration was written.
const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  ropsten: '3',
  rinkeby: '4',
  kovan: '42',
};

// Mirrors the historical `isSafeChainId` from app/util/networks, which
// accepted a decimal number (the current controller-utils version only
// accepts 0x-prefixed hex strings).
const isSafeChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;

/* eslint-disable @typescript-eslint/no-explicit-any */
// Legacy persisted state is expected to contain engine.backgroundState.
export default function migrate(state: unknown): Record<string, unknown>;
export default function migrate(state: any) {
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
    !isSafeChainId(parseInt(storedChainId, 10));

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

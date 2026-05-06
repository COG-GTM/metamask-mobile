import { isObject } from '@metamask/utils';
import { isSafeChainId } from '@metamask/controller-utils';
import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface Provider {
  type?: string;
  chainId?: string;
  ticker?: string;
  [key: string]: unknown;
}

// Decimal chain IDs of well-known networks at the time this migration ran.
// Replaces the deprecated `NetworksChainId` enum from `@metamask/controller-utils`.
const NETWORKS_CHAIN_ID: Record<string, string> = {
  mainnet: '1',
  ropsten: '3',
  rinkeby: '4',
  goerli: '5',
  kovan: '42',
  rpc: '',
  localhost: '',
};

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.NetworkController)
  ) {
    captureException(
      new Error(
        `Migration 3: Invalid state structure for NetworkController migration`,
      ),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as { provider: Provider };
  const provider = networkController.provider;
  const chainId = provider.type ? NETWORKS_CHAIN_ID[provider.type] : undefined;
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
    !isDecimalString ||
    !isSafeChainId(
      parseInt(storedChainId, 10) as unknown as `0x${string}`,
    );

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NETWORKS_CHAIN_ID.goerli,
    };
  }
  return state;
}

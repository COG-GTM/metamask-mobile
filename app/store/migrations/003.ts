import { MAX_SAFE_CHAIN_ID } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';
import { LEGACY_NETWORKS_CHAIN_ID as NetworksChainId } from './util/legacyNetworksChainId';

const isSafeChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;

interface Provider {
  type: string;
  chainId?: string;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: Provider;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  const provider = typedState.engine.backgroundState.NetworkController.provider;
  const chainId = (NetworksChainId as Record<string, string>)[provider.type];
  // if chainId === '' is a rpc
  if (chainId) {
    typedState.engine.backgroundState.NetworkController.provider = {
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
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return typedState;
}

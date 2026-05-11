import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

const MAX_SAFE_CHAIN_ID = 4503599627370476;
const isSafeChainIdNumber = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;

// Historical chain IDs as decimal strings, used by this legacy migration
// when the @metamask/controller-utils package still exported NetworksChainId.
const LEGACY_NETWORKS_CHAIN_ID: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  rpc: '',
};

interface ProviderConfig {
  type: string;
  chainId?: string | number;
  ticker?: string;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: {
          provider: ProviderConfig;
        };
      };
    };
  };
  const provider = typedState.engine.backgroundState.NetworkController.provider;
  const chainId = LEGACY_NETWORKS_CHAIN_ID[provider.type];
  // if chainId === '' is a rpc
  if (chainId) {
    typedState.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return state as Record<string, unknown>;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainIdNumber(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: LEGACY_NETWORKS_CHAIN_ID.goerli,
    };
  }
  return state as Record<string, unknown>;
}

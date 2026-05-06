import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

// Historical decimal chain ID mapping by network type, captured at the time
// this migration was authored. The upstream package has since switched to
// hex strings, so we keep these literals locally to preserve original
// migration semantics.
const NetworksChainIdLegacy: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  rpc: '',
};

const MAX_SAFE_CHAIN_ID = 4503599627370476;

function isSafeChainIdLegacy(chainId: number): boolean {
  return (
    Number.isSafeInteger(chainId) &&
    chainId > 0 &&
    chainId <= MAX_SAFE_CHAIN_ID
  );
}

interface ProviderConfig {
  type: string;
  chainId?: string | unknown;
  ticker?: string;
  [key: string]: unknown;
}

export default function migrate(state: unknown): unknown {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: { provider: ProviderConfig };
      };
    };
  };
  const provider =
    typedState.engine.backgroundState.NetworkController.provider;
  const chainId = NetworksChainIdLegacy[provider.type];
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
    !isDecimalString || !isSafeChainIdLegacy(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainIdLegacy.goerli,
    };
  }
  return state;
}

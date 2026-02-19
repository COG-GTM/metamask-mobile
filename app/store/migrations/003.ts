import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

const MAX_SAFE_CHAIN_ID = 4503599627370476;

function isSafeChainId(chainId: number): boolean {
  return Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;
}

const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
};

interface Provider {
  type: string;
  chainId?: string;
  ticker?: string;
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
  const s = state as MigrationState;
  const provider = s.engine.backgroundState.NetworkController.provider;
  const chainId = NetworksChainId[provider.type];
  if (chainId) {
    s.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return state;
  }

  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    s.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state;
}

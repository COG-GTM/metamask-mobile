import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

const MAX_SAFE_CHAIN_ID = 4503599627370476;

function isSafeChainId(chainId: number): boolean {
  return Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;
}

interface Provider {
  type?: string;
  chainId: string;
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

  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  const chainIdNumber = parseInt(provider.chainId, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    s.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    } as Provider;
  }
  return state;
}

import { GOERLI } from '../../../app/constants/network';

// Decimal goerli chain ID as used by the network controller at the time of this
// migration (chain IDs are converted to hex later, in migration 29).
const GOERLI_CHAIN_ID = '5';

interface ProviderConfig {
  chainId?: string;
  ticker?: string;
  type?: string;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: ProviderConfig;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

export default function migrate(stateUnknown: unknown) {
  const state = stateUnknown as MigrationState;
  const chainId =
    state.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    state.engine.backgroundState.NetworkController.providerConfig = {
      chainId: GOERLI_CHAIN_ID,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

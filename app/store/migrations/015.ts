import {
  GOERLI,
  NETWORKS_CHAIN_ID as NetworksChainId,
} from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId: string;
          [key: string]: unknown;
        };
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  const chainId =
    typedState.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    typedState.engine.backgroundState.NetworkController.providerConfig = {
      chainId: NetworksChainId.GOERLI,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return typedState;
}

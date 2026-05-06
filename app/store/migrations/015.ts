import { GOERLI } from '../../../app/constants/network';

const NetworksChainIdLegacy = {
  goerli: '5',
} as const;

interface State015 {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId?: string;
          ticker?: string;
          type?: string;
          [key: string]: unknown;
        };
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State015;
  const chainId =
    typedState.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    typedState.engine.backgroundState.NetworkController.providerConfig = {
      chainId: NetworksChainIdLegacy.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

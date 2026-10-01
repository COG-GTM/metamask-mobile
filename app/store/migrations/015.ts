import { GOERLI } from '../../../app/constants/network';

const LEGACY_NETWORKS_CHAIN_ID = {
  goerli: '5',
} as const;

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: {
          providerConfig: {
            chainId: string;
            ticker?: string;
            type?: string;
          };
        };
      };
    };
  };
  const chainId =
    typedState.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    typedState.engine.backgroundState.NetworkController.providerConfig = {
      chainId: LEGACY_NETWORKS_CHAIN_ID.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state as Record<string, unknown>;
}

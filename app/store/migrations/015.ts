import { GOERLI } from '../../../app/constants/network';

const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  'linea-goerli': '59140',
  'linea-mainnet': '59144',
};

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId: string;
          ticker?: string;
          type?: string;
          [key: string]: unknown;
        };
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const chainId =
    s.engine.backgroundState.NetworkController.providerConfig.chainId;
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    s.engine.backgroundState.NetworkController.providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

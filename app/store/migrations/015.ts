import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: {
          providerConfig: {
            chainId?: string;
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
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: {
          provider: {
            type?: string;
            chainId?: string;
            ticker?: string;
          };
        };
      };
    };
  };
  const provider = typedState.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}

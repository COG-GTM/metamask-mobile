import {
  getAllNetworks,
  // `isSafeChainId` is no longer exported by `app/util/networks`. This
  // migration predates its removal and is kept as-is so that runtime
  // behavior is unchanged.
  // @ts-expect-error Missing export in `app/util/networks`
  isSafeChainId,
} from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface Migration002State {
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
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration002State;
  const provider = state.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    state.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}

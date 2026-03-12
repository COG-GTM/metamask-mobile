import { getAllNetworks } from '../../util/networks';
import { isSafeChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  const provider = s.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber as unknown as `0x${string}`);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    s.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return s;
}

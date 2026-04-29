import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  const chainId =
    (engineState.backgroundState.NetworkController.providerConfig as Record<string, unknown>).chainId as string;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    engineState.backgroundState.NetworkController.providerConfig = {
      chainId: (NetworksChainId as Record<string, string>).goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

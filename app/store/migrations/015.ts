import { GOERLI } from '../../../app/constants/network';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Legacy persisted state is expected to contain engine.backgroundState.
export default function migrate(state: unknown): Record<string, unknown>;
export default function migrate(state: any) {
  const chainId =
    state.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    state.engine.backgroundState.NetworkController.providerConfig = {
      // Historical `NetworksChainId.goerli` (decimal chain ID).
      chainId: '5',
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

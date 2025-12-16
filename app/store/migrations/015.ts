import { isObject } from '@metamask/utils';
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const networkController = engineState.backgroundState.NetworkController as Record<string, unknown> | undefined;
  if (!networkController?.providerConfig) {
    return state;
  }

  const providerConfig = networkController.providerConfig as Record<string, unknown>;
  const chainId = providerConfig.chainId as string | undefined;

  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkController.providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}

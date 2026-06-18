import { isObject } from '@metamask/utils';
import { GOERLI } from '../../../app/constants/network';

const NetworksChainId = {
  goerli: '5',
} as const;

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const networkController = state.engine.backgroundState
    .NetworkController as Record<string, unknown> | undefined;
  if (!isObject(networkController)) return state;

  const providerConfig = networkController.providerConfig as Record<string, unknown> | undefined;
  if (!isObject(providerConfig)) return state;

  const chainId = providerConfig.chainId as string;
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

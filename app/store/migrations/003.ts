import * as ControllerUtils from '@metamask/controller-utils';
import * as networksModule from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

// `NetworksChainId` and `isSafeChainId` were historical exports that no longer
// exist on these modules. Cast through unknown to preserve the original
// (broken) runtime behavior without altering it.
const NetworksChainId = (
  ControllerUtils as unknown as {
    NetworksChainId?: Record<string, string>;
  }
).NetworksChainId as Record<string, string>;
const isSafeChainId = (
  networksModule as unknown as {
    isSafeChainId?: (chainId: number) => boolean;
  }
).isSafeChainId as (chainId: number) => boolean;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const provider = state.engine.backgroundState.NetworkController.provider;
  const chainId = NetworksChainId[provider.type];
  // if chainId === '' is a rpc
  if (chainId) {
    state.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return state;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    state.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state;
}

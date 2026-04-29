import { NetworksChainId } from '@metamask/controller-utils';
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  const provider = engineState.backgroundState.NetworkController.provider as Record<string, unknown>;
  const chainId = (NetworksChainId as Record<string, string>)[provider.type as string];
  // if chainId === '' is a rpc
  if (chainId) {
    engineState.backgroundState.NetworkController.provider = {
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
    engineState.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: (NetworksChainId as Record<string, string>).goerli,
    };
  }
  return state;
}

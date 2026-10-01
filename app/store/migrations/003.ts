import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

// `NetworksChainId` was removed from @metamask/controller-utils and `isSafeChainId`
// is not exported by util/networks; at runtime both are `undefined`, preserving
// this dormant migration's original behavior.
const NetworksChainId = undefined as unknown as Record<string, string>;
const isSafeChainId = undefined as unknown as (chainId: number) => boolean;

interface ProviderConfig {
  type: string;
  chainId?: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: state.engine.backgroundState.NetworkController.provider
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
  const provider = backgroundState.NetworkController
    .provider as ProviderConfig;
  const chainId = NetworksChainId[provider.type];
  // if chainId === '' is a rpc
  if (chainId) {
    backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return state as Record<string, unknown>;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state as Record<string, unknown>;
}

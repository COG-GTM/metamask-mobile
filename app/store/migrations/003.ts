// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - `NetworksChainId` is no longer exported by `@metamask/controller-utils`;
// the import is preserved as-is to keep this legacy migration's behaviour unchanged.
import { NetworksChainId } from '@metamask/controller-utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - `isSafeChainId` is no longer exported by `../../util/networks`; the
// import is preserved as-is to keep this legacy migration's behaviour unchanged.
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface MigrationState {
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

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const provider =
    migratedState.engine.backgroundState.NetworkController.provider;
  const chainId = NetworksChainId[provider.type as string];
  // if chainId === '' is a rpc
  if (chainId) {
    migratedState.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return migratedState;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    migratedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return migratedState;
}

import { isSafeChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

// NetworksChainId was removed from @metamask/controller-utils in a later version.
// Using a local copy for this legacy migration.
const NetworksChainId: Record<string, string> = {
  mainnet: '1',
  goerli: '5',
  sepolia: '11155111',
  linea_goerli: '59140',
  linea_mainnet: '59144',
};

export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  const provider = s.engine.backgroundState.NetworkController.provider;
  const chainId = NetworksChainId[provider.type];
  // if chainId === '' is a rpc
  if (chainId) {
    s.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return s;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10) as unknown as `0x${string}`);

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    s.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return s;
}

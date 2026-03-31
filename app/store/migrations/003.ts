import { isSafeChainId } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 3: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  const provider = typedState.engine.backgroundState.NetworkController.provider;
  // Decimal chain IDs matching the original NetworksChainId enum values
  const networksChainId: Record<string, string> = {
    mainnet: '1',
    ropsten: '3',
    rinkeby: '4',
    goerli: '5',
    kovan: '42',
    sepolia: '11155111',
    'linea-goerli': '59140',
    'linea-mainnet': '59144',
  };
  const chainId =
    networksChainId[provider.type as string];
  // if chainId === '' is a rpc
  if (chainId) {
    typedState.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return typedState;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10) as any);

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: '5',
    };
  }
  return typedState;
}

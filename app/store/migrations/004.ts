import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

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

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 4: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  const { allTokens } = typedState.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    typedState.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    typedState.engine.backgroundState.PreferencesController;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newAllCollectibleContracts: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newAllCollectibles: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newAllTokens: Record<string, any> = {};

  Object.keys(allTokens).forEach((address: string) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType: string) => {
      if (networksChainId[networkType]) {
        newAllTokens[address][
          networksChainId[networkType]
        ] = allTokens[address][networkType];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
          newAllTokens[address][chainId] = allTokens[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibles).forEach((address: string) => {
    newAllCollectibles[address] = {};
    Object.keys(allCollectibles[address]).forEach((networkType: string) => {
      if (networksChainId[networkType]) {
        newAllCollectibles[address][
          networksChainId[networkType]
        ] = allCollectibles[address][networkType];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
          newAllCollectibles[address][chainId] =
            allCollectibles[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibleContracts).forEach((address: string) => {
    newAllCollectibleContracts[address] = {};
    Object.keys(allCollectibleContracts[address]).forEach(
      (networkType: string) => {
        if (networksChainId[networkType]) {
          newAllCollectibleContracts[address][
            networksChainId[networkType]
          ] = allCollectibleContracts[address][networkType];
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
            newAllCollectibleContracts[address][chainId] =
              allCollectibleContracts[address][networkType];
          });
        }
      },
    );
  });

  typedState.engine.backgroundState.TokensController = {
    ...typedState.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  typedState.engine.backgroundState.CollectiblesController = {
    ...typedState.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return typedState;
}

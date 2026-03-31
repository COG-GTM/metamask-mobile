import { ChainId } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

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
      if (ChainId[networkType as keyof typeof ChainId]) {
        newAllTokens[address][
          ChainId[networkType as keyof typeof ChainId]
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
      if (ChainId[networkType as keyof typeof ChainId]) {
        newAllCollectibles[address][
          ChainId[networkType as keyof typeof ChainId]
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
        if (ChainId[networkType as keyof typeof ChainId]) {
          newAllCollectibleContracts[address][
            ChainId[networkType as keyof typeof ChainId]
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

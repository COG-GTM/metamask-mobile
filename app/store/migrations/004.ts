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
  const { allTokens } = s.engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    s.engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    s.engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: Record<string, any> = {};
  const newAllCollectibles: Record<string, any> = {};
  const newAllTokens: Record<string, any> = {};

  Object.keys(allTokens).forEach((address) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType) => {
      if (NetworksChainId[networkType]) {
        newAllTokens[address][NetworksChainId[networkType]] =
          allTokens[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
          newAllTokens[address][chainId] = allTokens[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibles).forEach((address) => {
    newAllCollectibles[address] = {};
    Object.keys(allCollectibles[address]).forEach((networkType) => {
      if (NetworksChainId[networkType]) {
        newAllCollectibles[address][NetworksChainId[networkType]] =
          allCollectibles[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
          newAllCollectibles[address][chainId] =
            allCollectibles[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibleContracts).forEach((address) => {
    newAllCollectibleContracts[address] = {};
    Object.keys(allCollectibleContracts[address]).forEach((networkType) => {
      if (NetworksChainId[networkType]) {
        newAllCollectibleContracts[address][NetworksChainId[networkType]] =
          allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
          newAllCollectibleContracts[address][chainId] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  s.engine.backgroundState.TokensController = {
    ...s.engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  s.engine.backgroundState.CollectiblesController = {
    ...s.engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return s;
}

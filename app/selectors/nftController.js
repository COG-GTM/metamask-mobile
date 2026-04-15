import { createSelector } from 'reselect';



const selectNftControllerState = (state) =>
state.engine.backgroundState.NftController;

export const selectAllNftContracts = createSelector(
  selectNftControllerState,
  (nftControllerState) =>
  nftControllerState.allNftContracts
);

export const selectAllNfts = createSelector(
  selectNftControllerState,
  (nftControllerState) => nftControllerState.allNfts
);

export const selectAllNftsFlat = createSelector(
  selectAllNfts,
  (nftsByChainByAccount) => {
    const nftsByChainArray = Object.values(nftsByChainByAccount);
    return nftsByChainArray.reduce((acc, nftsByChain) => {
      const nftsArrays = Object.values(nftsByChain);
      return acc.concat(...nftsArrays);
    }, []);
  }
);
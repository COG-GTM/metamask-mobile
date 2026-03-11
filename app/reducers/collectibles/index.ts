import { createSelector } from 'reselect';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';
import { RootState } from '..';

interface CollectibleReference {
  tokenId: string;
  address: string;
}

type FavoritesByChain = Record<string, CollectibleReference[]>;
type FavoritesByAddress = Record<string, FavoritesByChain>;

export interface CollectiblesState {
  favorites: FavoritesByAddress;
  isNftFetchingProgress: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const favoritesSelector = (state: any) => state.collectibles.favorites;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNftFetchingProgressSelector = (state: any): boolean =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (address: any, chainId: any, allNftContracts: any) =>
    allNftContracts[address]?.[chainId] || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (address: any, allNftContracts: any) => allNftContracts[address] || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (address: any, chainId: any, allNfts: any) => allNfts[address]?.[chainId] || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (address: any, allNfts: any) => allNfts[address] || {},
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (address: any, chainId: any, favorites: any) =>
    favorites[address]?.[chainId] || [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (_state: any, collectible: CollectibleReference) => collectible,
  (favoriteCollectibles: CollectibleReference[], collectible: CollectibleReference) =>
    Boolean(
      favoriteCollectibles.find(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      ),
    ),
);

const getFavoritesCollectibles = (
  favoriteCollectibles: FavoritesByAddress,
  selectedAddress: string,
  chainId: string,
): CollectibleReference[] => favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE' as const;
export const REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE' as const;
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER' as const;
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER' as const;

export const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectiblesFavoritesReducer = (state: CollectiblesState = initialState, action: any): CollectiblesState => {
  switch (action.type) {
    case ADD_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress,
        chainId,
      );
      collectibles.push({
        tokenId: collectible.tokenId,
        address: collectible.address,
      });
      const selectedAddressCollectibles =
        state.favorites[selectedAddress] || {};
      return {
        ...state,
        favorites: {
          ...state.favorites,
          [selectedAddress]: {
            ...selectedAddressCollectibles,
            [chainId]: collectibles.slice(),
          },
        },
      };
    }
    case REMOVE_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress,
        chainId,
      );
      const indexToRemove = collectibles.findIndex(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      );
      collectibles.splice(indexToRemove, 1);
      const selectedAddressCollectibles =
        state.favorites[selectedAddress] || {};
      return {
        ...state,
        favorites: {
          ...state.favorites,
          [selectedAddress]: {
            ...selectedAddressCollectibles,
            [chainId]: collectibles.slice(),
          },
        },
      };
    }
    case SHOW_NFT_FETCHING_LOADER: {
      return {
        ...state,
        isNftFetchingProgress: true,
      };
    }
    case HIDE_NFT_FETCHING_LOADER: {
      return {
        ...state,
        isNftFetchingProgress: false,
      };
    }
    default: {
      return state;
    }
  }
};

export const showNftFetchingLoadingIndicator = () => ({
  type: SHOW_NFT_FETCHING_LOADER,
});

export const hideNftFetchingLoadingIndicator = () => ({
  type: HIDE_NFT_FETCHING_LOADER,
});

export default collectiblesFavoritesReducer;

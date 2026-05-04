/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';
import { RootState } from '../../reducers';

interface CollectibleIdentifier {
  tokenId: string;
  address: string;
}

interface FavoritesMap {
  [address: string]: {
    [chainId: string]: CollectibleIdentifier[];
  };
}

export interface CollectiblesState {
  favorites: FavoritesMap;
  isNftFetchingProgress: boolean;
}

const favoritesSelector = (state: RootState) => state.collectibles.favorites;

export const isNftFetchingProgressSelector = (state: RootState) =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address: string, chainId: string, allNftContracts: Record<string, Record<string, unknown[]>>) =>
    allNftContracts[address]?.[chainId] || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address: string, allNftContracts: Record<string, Record<string, unknown[]>>) => allNftContracts[address] || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (address: string, chainId: string, allNfts: Record<string, Record<string, unknown[]>>) => allNfts[address]?.[chainId] || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address: string, allNfts: Record<string, Record<string, unknown[]>>) => allNfts[address] || {},
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (address: string, chainId: string, favorites: FavoritesMap) => favorites[address]?.[chainId] || [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (_state: RootState, collectible: CollectibleIdentifier) => collectible,
  (favoriteCollectibles: CollectibleIdentifier[], collectible: CollectibleIdentifier) =>
    Boolean(
      favoriteCollectibles.find(
        ({ tokenId, address }: CollectibleIdentifier) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      ),
    ),
);

const getFavoritesCollectibles = (
  favoriteCollectibles: FavoritesMap,
  selectedAddress: string,
  chainId: string,
): CollectibleIdentifier[] =>
  favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE' as const;
export const REMOVE_FAVORITE_COLLECTIBLE =
  'REMOVE_FAVORITE_COLLECTIBLE' as const;
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER' as const;
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER' as const;

interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: CollectibleIdentifier;
}

interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: CollectibleIdentifier;
}

interface ShowNftFetchingLoaderAction {
  type: typeof SHOW_NFT_FETCHING_LOADER;
}

interface HideNftFetchingLoaderAction {
  type: typeof HIDE_NFT_FETCHING_LOADER;
}

type CollectiblesReducerAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction
  | ShowNftFetchingLoaderAction
  | HideNftFetchingLoaderAction;

const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

const collectiblesFavoritesReducer = (
  state: CollectiblesState = initialState,
  action: CollectiblesReducerAction,
): CollectiblesState => {
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
        state.favorites[selectedAddress] || [];
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
        ({ tokenId, address }: CollectibleIdentifier) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      );
      collectibles.splice(indexToRemove, 1);
      const selectedAddressCollectibles =
        state.favorites[selectedAddress] || [];
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

export const showNftFetchingLoadingIndicator = (): ShowNftFetchingLoaderAction => ({
  type: SHOW_NFT_FETCHING_LOADER,
});

export const hideNftFetchingLoadingIndicator = (): HideNftFetchingLoaderAction => ({
  type: HIDE_NFT_FETCHING_LOADER,
});

export default collectiblesFavoritesReducer;

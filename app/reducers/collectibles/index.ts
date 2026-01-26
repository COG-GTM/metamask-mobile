import { createSelector } from 'reselect';
import { selectEvmChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';
import { RootState } from '..';

/**
 * Represents a favorite collectible item
 */
export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

/**
 * Represents favorites organized by address and chainId
 */
export interface FavoritesMap {
  [address: string]: {
    [chainId: string]: FavoriteCollectible[];
  };
}

/**
 * State shape for the collectibles reducer
 */
export interface CollectiblesState {
  favorites: FavoritesMap;
  isNftFetchingProgress: boolean;
}

/**
 * Action types for collectibles reducer
 */
export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE';
export const REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE';
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER';
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER';

interface AddFavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: {
    tokenId: string;
    address: string;
  };
}

interface RemoveFavoriteCollectibleAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: {
    tokenId: string;
    address: string;
  };
}

interface ShowNftFetchingLoaderAction {
  type: typeof SHOW_NFT_FETCHING_LOADER;
}

interface HideNftFetchingLoaderAction {
  type: typeof HIDE_NFT_FETCHING_LOADER;
}

type CollectiblesAction =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction
  | ShowNftFetchingLoaderAction
  | HideNftFetchingLoaderAction;

const favoritesSelector = (state: RootState) => state.collectibles.favorites;

export const isNftFetchingProgressSelector = (state: RootState) =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectEvmChainId,
  selectAllNftContracts,
  (address, chainId, allNftContracts) => {
    if (!address || !chainId) return [];
    return allNftContracts[address]?.[chainId] || [];
  },
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address, allNftContracts) => {
    if (!address) return {};
    return allNftContracts[address] || {};
  },
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectEvmChainId,
  selectAllNfts,
  (address, chainId, allNfts) => {
    if (!address || !chainId) return [];
    return allNfts[address]?.[chainId] || [];
  },
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address, allNfts) => {
    if (!address) return {};
    return allNfts[address] || {};
  },
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectEvmChainId,
  favoritesSelector,
  (address, chainId, favorites) => {
    if (!address || !chainId) return [];
    return favorites[address]?.[chainId] || [];
  },
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (
    _state: RootState,
    collectible: { tokenId: string; address: string },
  ) => collectible,
  (favoriteCollectibles, collectible) =>
    Boolean(
      favoriteCollectibles.find(
        ({ tokenId, address }: FavoriteCollectible) =>
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
): FavoriteCollectible[] =>
  favoriteCollectibles[selectedAddress]?.[chainId] || [];

const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

const collectiblesFavoritesReducer = (
  state: CollectiblesState = initialState,
  action: CollectiblesAction,
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

export const showNftFetchingLoadingIndicator = (): ShowNftFetchingLoaderAction => ({
  type: SHOW_NFT_FETCHING_LOADER,
});

export const hideNftFetchingLoadingIndicator = (): HideNftFetchingLoaderAction => ({
  type: HIDE_NFT_FETCHING_LOADER,
});

export default collectiblesFavoritesReducer;

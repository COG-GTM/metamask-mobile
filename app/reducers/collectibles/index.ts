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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const favoritesSelector = (state: any) => state.collectibles.favorites;

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNftFetchingProgressSelector = (state: any) =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address, chainId, allNftContracts) =>
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (address && chainId ? (allNftContracts as any)[address]?.[chainId] : undefined) || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address, allNftContracts) => (address ? allNftContracts[address] : undefined) || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (address, chainId, allNfts) => (address && chainId ? (allNfts as any)[address]?.[chainId] : undefined) || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address, allNfts) => (address ? allNfts[address] : undefined) || {},
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (address, chainId, favorites) => (address && chainId ? favorites[address]?.[chainId] : undefined) || [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (state: any, collectible: any) => collectible,
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (favoriteCollectibles: any[], collectible: any) =>
    Boolean(
      favoriteCollectibles.find(
        ({ tokenId, address }: { tokenId: string; address: string }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      ),
    ),
);

interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

interface FavoritesMap {
  [address: string]: {
    [chainId: string]: FavoriteCollectible[];
  };
}

const getFavoritesCollectibles = (
  favoriteCollectibles: FavoritesMap,
  selectedAddress: string,
  chainId: string,
): FavoriteCollectible[] => favoriteCollectibles[selectedAddress]?.[chainId] || [];

/**
 * Collectible action type constants
 */
export const CollectibleActionType = {
  ADD_FAVORITE_COLLECTIBLE: 'ADD_FAVORITE_COLLECTIBLE',
  REMOVE_FAVORITE_COLLECTIBLE: 'REMOVE_FAVORITE_COLLECTIBLE',
  SHOW_NFT_FETCHING_LOADER: 'SHOW_NFT_FETCHING_LOADER',
  HIDE_NFT_FETCHING_LOADER: 'HIDE_NFT_FETCHING_LOADER',
} as const;

export const ADD_FAVORITE_COLLECTIBLE = CollectibleActionType.ADD_FAVORITE_COLLECTIBLE;
export const REMOVE_FAVORITE_COLLECTIBLE = CollectibleActionType.REMOVE_FAVORITE_COLLECTIBLE;
export const SHOW_NFT_FETCHING_LOADER = CollectibleActionType.SHOW_NFT_FETCHING_LOADER;
export const HIDE_NFT_FETCHING_LOADER = CollectibleActionType.HIDE_NFT_FETCHING_LOADER;

/**
 * Collectibles favorites state interface
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CollectiblesState = {
  favorites: FavoritesMap;
  isNftFetchingProgress: boolean;
};

const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

interface AddFavoriteAction {
  type: typeof CollectibleActionType.ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteCollectible;
}

interface RemoveFavoriteAction {
  type: typeof CollectibleActionType.REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteCollectible;
}

interface ShowNftFetchingLoaderAction {
  type: typeof CollectibleActionType.SHOW_NFT_FETCHING_LOADER;
}

interface HideNftFetchingLoaderAction {
  type: typeof CollectibleActionType.HIDE_NFT_FETCHING_LOADER;
}

type CollectiblesReducerAction =
  | AddFavoriteAction
  | RemoveFavoriteAction
  | ShowNftFetchingLoaderAction
  | HideNftFetchingLoaderAction;

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectiblesFavoritesReducer = (
  state: CollectiblesState = initialState,
  action: any,
): CollectiblesState => {
  switch (action.type) {
    case CollectibleActionType.ADD_FAVORITE_COLLECTIBLE: {
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
    case CollectibleActionType.REMOVE_FAVORITE_COLLECTIBLE: {
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
    case CollectibleActionType.SHOW_NFT_FETCHING_LOADER: {
      return {
        ...state,
        isNftFetchingProgress: true,
      };
    }
    case CollectibleActionType.HIDE_NFT_FETCHING_LOADER: {
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
  type: CollectibleActionType.SHOW_NFT_FETCHING_LOADER,
});

export const hideNftFetchingLoadingIndicator = (): HideNftFetchingLoaderAction => ({
  type: CollectibleActionType.HIDE_NFT_FETCHING_LOADER,
});

export default collectiblesFavoritesReducer;

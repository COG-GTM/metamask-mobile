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
import type {
  AddFavoriteCollectibleAction,
  FavoriteCollectible,
  RemoveFavoriteCollectibleAction,
} from '../../actions/collectibles';
import type { RootState } from '..';

export type FavoriteCollectiblesByChainId = Record<
  string,
  FavoriteCollectible[]
>;

export type FavoriteCollectiblesByAddress = Record<
  string,
  FavoriteCollectiblesByChainId
>;

export interface CollectiblesState {
  favorites: FavoriteCollectiblesByAddress;
  isNftFetchingProgress: boolean;
}

const favoritesSelector = (state: RootState): FavoriteCollectiblesByAddress =>
  state.collectibles.favorites;

export const isNftFetchingProgressSelector = (state: RootState): boolean =>
  state.collectibles.isNftFetchingProgress;

const getByChainId = <T>(
  entriesByChainId: Record<string, T[]> | undefined,
  chainId: string,
): T[] => entriesByChainId?.[chainId] || [];

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address, chainId, allNftContracts) =>
    getByChainId(address ? allNftContracts[address] : undefined, chainId),
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address, allNftContracts) =>
    (address ? allNftContracts[address] : undefined) || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (address, chainId, allNfts) =>
    getByChainId(address ? allNfts[address] : undefined, chainId),
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
  (address, chainId, favorites) =>
    getByChainId(address ? favorites[address] : undefined, chainId),
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (_state: RootState, collectible: FavoriteCollectible) => collectible,
  (favoriteCollectibles, collectible) =>
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
  favoriteCollectibles: FavoriteCollectiblesByAddress,
  selectedAddress: string,
  chainId: string,
): FavoriteCollectible[] =>
  favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE' as const;
export const REMOVE_FAVORITE_COLLECTIBLE =
  'REMOVE_FAVORITE_COLLECTIBLE' as const;
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER' as const;
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER' as const;

interface ShowNftFetchingLoaderAction {
  type: typeof SHOW_NFT_FETCHING_LOADER;
}

interface HideNftFetchingLoaderAction {
  type: typeof HIDE_NFT_FETCHING_LOADER;
}

export type CollectiblesAction =
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
  action: CollectiblesAction,
): CollectiblesState => {
  switch (action.type) {
    case ADD_FAVORITE_COLLECTIBLE: {
      const { collectible } = action;
      const selectedAddress = String(action.selectedAddress);
      const chainId = String(action.chainId);
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
      const { collectible } = action;
      const selectedAddress = String(action.selectedAddress);
      const chainId = String(action.chainId);
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

export const showNftFetchingLoadingIndicator =
  (): ShowNftFetchingLoaderAction => ({
    type: SHOW_NFT_FETCHING_LOADER,
  });

export const hideNftFetchingLoadingIndicator =
  (): HideNftFetchingLoaderAction => ({
    type: HIDE_NFT_FETCHING_LOADER,
  });

export default collectiblesFavoritesReducer;

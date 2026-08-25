import { createSelector } from 'reselect';
import { Hex } from '@metamask/utils';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';
import { RootState } from '..';

/**
 * A favorited collectible, identified by its contract address and token ID.
 */
export interface FavoriteCollectible {
  address: string;
  tokenId: string;
}

/**
 * Favorites, keyed by account address and then by chain ID.
 */
export type FavoriteCollectiblesByAddress = Record<
  string,
  Record<string, FavoriteCollectible[]> | undefined
>;

export interface CollectiblesState {
  favorites: FavoriteCollectiblesByAddress;
  isNftFetchingProgress: boolean;
}

interface CollectiblesAction {
  type: string | null;
  selectedAddress?: string;
  chainId?: string;
  collectible?: FavoriteCollectible;
}

const favoritesSelector = (state: RootState) =>
  state.collectibles.favorites as FavoriteCollectiblesByAddress;

export const isNftFetchingProgressSelector = (state: RootState) =>
  state.collectibles.isNftFetchingProgress as boolean;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address, chainId, allNftContracts) =>
    allNftContracts[address as Hex]?.[chainId as Hex] || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address, allNftContracts) => allNftContracts[address as Hex] || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (address, chainId, allNfts) => allNfts[address as Hex]?.[chainId as Hex] || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address, allNfts) => allNfts[address as Hex] || {},
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (address, chainId, favorites) =>
    favorites[address as string]?.[chainId] || [],
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
) => favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE';
export const REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE';
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER';
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER';

const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

/* eslint-disable @typescript-eslint/default-param-last */
const collectiblesFavoritesReducer = (
  state: CollectiblesState = initialState,
  action: CollectiblesAction,
): CollectiblesState => {
  switch (action.type) {
    case ADD_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress as string,
        chainId as string,
      );
      collectibles.push({
        tokenId: (collectible as FavoriteCollectible).tokenId,
        address: (collectible as FavoriteCollectible).address,
      });
      const selectedAddressCollectibles =
        state.favorites[selectedAddress as string] || {};
      return {
        ...state,
        favorites: {
          ...state.favorites,
          [selectedAddress as string]: {
            ...selectedAddressCollectibles,
            [chainId as string]: collectibles.slice(),
          },
        },
      };
    }
    case REMOVE_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress as string,
        chainId as string,
      );
      const indexToRemove = collectibles.findIndex(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, (collectible as FavoriteCollectible).tokenId) &&
          address === (collectible as FavoriteCollectible).address,
      );
      collectibles.splice(indexToRemove, 1);
      const selectedAddressCollectibles =
        state.favorites[selectedAddress as string] || {};
      return {
        ...state,
        favorites: {
          ...state.favorites,
          [selectedAddress as string]: {
            ...selectedAddressCollectibles,
            [chainId as string]: collectibles.slice(),
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

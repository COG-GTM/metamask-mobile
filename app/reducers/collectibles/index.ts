/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import { Nft } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';
import type { RootState } from '../index';
import type { CollectiblesAction } from '../../actions/collectibles';

/**
 * Favorite collectibles are stored by account address and then by chain id.
 */
export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

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

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address, chainId, allNftContracts) =>
    allNftContracts[address as string]?.[chainId as Hex] || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address, allNftContracts) => allNftContracts[address as string] || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (address, chainId, allNfts) =>
    allNfts[address as string]?.[chainId as Hex] || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address, allNfts) => allNfts[address as string] || {},
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
  (_state: RootState, collectible: Nft) => collectible,
  (favoriteCollectibles, collectible) =>
    Boolean(
      favoriteCollectibles.find(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId as string) &&
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

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE';
export const REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE';
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER';
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER';

export interface ShowNftFetchingLoaderAction {
  type: typeof SHOW_NFT_FETCHING_LOADER;
}

export interface HideNftFetchingLoaderAction {
  type: typeof HIDE_NFT_FETCHING_LOADER;
}

export type CollectiblesReducerAction =
  | CollectiblesAction
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
        tokenId: collectible.tokenId as string,
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
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId as string) &&
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

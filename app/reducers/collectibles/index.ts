/* eslint-disable @typescript-eslint/default-param-last */
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

export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

export type FavoriteCollectibles = Record<
  string,
  Record<string, FavoriteCollectible[]>
>;

export interface CollectiblesState {
  favorites: FavoriteCollectibles;
  isNftFetchingProgress: boolean;
}

const favoritesSelector = (state: RootState): FavoriteCollectibles =>
  state.collectibles.favorites;

export const isNftFetchingProgressSelector = (state: RootState): boolean =>
  state.collectibles.isNftFetchingProgress;

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
  (address, chainId, allNfts) =>
    allNfts[address as Hex]?.[chainId as Hex] || [],
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
    favorites[address as Hex]?.[chainId as Hex] || [],
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
  favoriteCollectibles: FavoriteCollectibles,
  selectedAddress: string,
  chainId: string,
) => favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE';
export const REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE';
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER';
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER';

interface FavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE | typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteCollectible;
}

interface NftFetchingLoaderAction {
  type: typeof SHOW_NFT_FETCHING_LOADER | typeof HIDE_NFT_FETCHING_LOADER;
}

export type CollectiblesAction =
  | FavoriteCollectibleAction
  | NftFetchingLoaderAction;

const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

const collectiblesFavoritesReducer = (
  state = initialState,
  action: CollectiblesAction | Record<'type', null>,
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

export const showNftFetchingLoadingIndicator = () => ({
  type: SHOW_NFT_FETCHING_LOADER,
});

export const hideNftFetchingLoadingIndicator = () => ({
  type: HIDE_NFT_FETCHING_LOADER,
});

export default collectiblesFavoritesReducer;

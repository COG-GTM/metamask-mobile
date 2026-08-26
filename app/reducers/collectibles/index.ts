/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import type { Action } from '../../actions/collectibles';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';

interface Collectible {
  tokenId: unknown;
  address: string;
  [key: string]: unknown;
}

interface FavoriteCollectible {
  tokenId: unknown;
  address: string;
}

export interface State {
  favorites: Record<string, Record<string, FavoriteCollectible[]>>;
  isNftFetchingProgress: boolean;
}

interface SelectorState {
  collectibles: State;
}

const favoritesSelector = (
  state: SelectorState,
): State['favorites'] => state.collectibles.favorites;

export const isNftFetchingProgressSelector = (
  state: SelectorState,
): boolean => state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address: any, chainId: any, allNftContracts: any) =>
    allNftContracts[address]?.[chainId] || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address: any, allNftContracts: any) =>
    allNftContracts[address] || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (address: any, chainId: any, allNfts: any) =>
    allNfts[address]?.[chainId] || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address: any, allNfts: any) => allNfts[address] || {},
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (address: any, chainId: any, favorites: State['favorites']) =>
    favorites[address]?.[chainId] || [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (_state: SelectorState, collectible: Collectible) => collectible,
  (favoriteCollectibles, collectible) =>
    Boolean(
      favoriteCollectibles.find(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(
            tokenId as string,
            collectible.tokenId as string,
          ) &&
          address === collectible.address,
      ),
    ),
);

const getFavoritesCollectibles = (
  favoriteCollectibles: State['favorites'],
  selectedAddress: string,
  chainId: string,
): FavoriteCollectible[] =>
  favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE' as const;
export const REMOVE_FAVORITE_COLLECTIBLE =
  'REMOVE_FAVORITE_COLLECTIBLE' as const;
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER' as const;
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER' as const;

export const initialState: State = {
  favorites: {},
  isNftFetchingProgress: false,
};

type ReducerAction =
  | Action
  | { type: typeof SHOW_NFT_FETCHING_LOADER }
  | { type: typeof HIDE_NFT_FETCHING_LOADER };

const collectiblesFavoritesReducer = (
  state: State = initialState,
  action: ReducerAction,
): State => {
  switch (action.type) {
    case ADD_FAVORITE_COLLECTIBLE: {
      const selectedAddress = action.selectedAddress as string;
      const chainId = action.chainId as string;
      const collectible = action.collectible as Collectible;
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
      const selectedAddress = action.selectedAddress as string;
      const chainId = action.chainId as string;
      const collectible = action.collectible as Collectible;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress,
        chainId,
      );
      const indexToRemove = collectibles.findIndex(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(
            tokenId as string,
            collectible.tokenId as string,
          ) &&
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

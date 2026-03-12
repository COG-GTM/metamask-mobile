// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSelector } from 'reselect';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// TODO: Replace "any" with type
const favoritesSelector = (state: any) => state.collectibles.favorites;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// TODO: Replace "any" with type
export const isNftFetchingProgressSelector = (state: any): boolean =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address, chainId, allNftContracts) =>
    allNftContracts[address]?.[chainId] || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address, allNftContracts) => allNftContracts[address] || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (address, chainId, allNfts) => allNfts[address]?.[chainId] || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address, allNfts) => allNfts[address] || {},
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (address, chainId, favorites) => favorites[address]?.[chainId] || [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (state, collectible) => collectible,
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

interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

export interface CollectiblesState {
  favorites: Record<string, Record<string, FavoriteCollectible[]>>;
  isNftFetchingProgress: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// TODO: Replace "any" with type
interface CollectiblesAction {
  type: string;
  selectedAddress?: string;
  chainId?: string;
  collectible?: FavoriteCollectible;
}

const getFavoritesCollectibles = (
  favoriteCollectibles: Record<string, Record<string, FavoriteCollectible[]>>,
  selectedAddress: string,
  chainId: string,
): FavoriteCollectible[] => favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE';
export const REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE';
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER';
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER';

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

export const showNftFetchingLoadingIndicator = (): { type: string } => ({
  type: SHOW_NFT_FETCHING_LOADER,
});

export const hideNftFetchingLoadingIndicator = (): { type: string } => ({
  type: HIDE_NFT_FETCHING_LOADER,
});

export default collectiblesFavoritesReducer;

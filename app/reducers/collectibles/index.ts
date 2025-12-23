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
import { Nft, NftContract } from '@metamask/assets-controllers';

interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

interface FavoritesMap {
  [address: string]: {
    [chainId: string]: FavoriteCollectible[];
  };
}

export interface CollectiblesState {
  favorites: FavoritesMap;
  isNftFetchingProgress: boolean;
}

const favoritesSelector = (state: RootState): FavoritesMap =>
  state.collectibles.favorites;

export const isNftFetchingProgressSelector = (state: RootState): boolean =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (
    address: string | undefined,
    chainId: string,
    allNftContracts: Record<string, Record<string, NftContract[]>>,
  ): NftContract[] => (address ? allNftContracts[address]?.[chainId] || [] : []),
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (
    address: string | undefined,
    allNftContracts: Record<string, Record<string, NftContract[]>>,
  ): Record<string, NftContract[]> =>
    address ? allNftContracts[address] || {} : {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (
    address: string | undefined,
    chainId: string,
    allNfts: Record<string, Record<string, Nft[]>>,
  ): Nft[] => (address ? allNfts[address]?.[chainId] || [] : []),
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (
    address: string | undefined,
    allNfts: Record<string, Record<string, Nft[]>>,
  ): Record<string, Nft[]> => (address ? allNfts[address] || {} : {}),
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (
    address: string | undefined,
    chainId: string,
    favorites: FavoritesMap,
  ): FavoriteCollectible[] =>
    address ? favorites[address]?.[chainId] || [] : [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (_state: RootState, collectible: FavoriteCollectible) => collectible,
  (
    favoriteCollectibles: FavoriteCollectible[],
    collectible: FavoriteCollectible,
  ): boolean =>
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
  favoriteCollectibles: FavoritesMap,
  selectedAddress: string,
  chainId: string,
): FavoriteCollectible[] =>
  favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE';
export const REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE';
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER';
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER';

const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

interface CollectiblesAction {
  type: string;
  selectedAddress?: string;
  chainId?: string;
  collectible?: FavoriteCollectible;
}

const collectiblesFavoritesReducer = (
  state: CollectiblesState = initialState,
  action: CollectiblesAction,
): CollectiblesState => {
  switch (action.type) {
    case ADD_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      if (!selectedAddress || !chainId || !collectible) {
        return state;
      }
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
      if (!selectedAddress || !chainId || !collectible) {
        return state;
      }
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

export const showNftFetchingLoadingIndicator = (): { type: string } => ({
  type: SHOW_NFT_FETCHING_LOADER,
});

export const hideNftFetchingLoadingIndicator = (): { type: string } => ({
  type: HIDE_NFT_FETCHING_LOADER,
});

export default collectiblesFavoritesReducer;

import { createSlice, isDraft, original } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { Hex } from '@metamask/utils';
import { Nft, NftContract } from '@metamask/assets-controllers';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';
import type { RootState } from '..';
import {
  ActionType,
  type AddFavoriteCollectibleAction,
  type FavoriteCollectibleInput,
  type HideNftFetchingLoaderAction,
  type RemoveFavoriteCollectibleAction,
  type ShowNftFetchingLoaderAction,
} from '../../actions/collectibles';

export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

export interface CollectiblesState {
  favorites: Record<string, Record<string, FavoriteCollectible[]>>;
  isNftFetchingProgress: boolean;
}

const favoritesSelector = (state: RootState): CollectiblesState['favorites'] =>
  state.collectibles.favorites;

export const isNftFetchingProgressSelector = (state: RootState): boolean =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (address, chainId, allNftContracts): NftContract[] =>
    allNftContracts[address as string]?.[chainId as Hex] || [],
);

export const multichainCollectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectAllNftContracts,
  (address, allNftContracts): { [chainId: Hex]: NftContract[] } =>
    allNftContracts[address as string] || {},
);

export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (address, chainId, allNfts): Nft[] =>
    allNfts[address as string]?.[chainId as Hex] || [],
);

export const multichainCollectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectAllNfts,
  (address, allNfts): { [chainId: Hex]: Nft[] } =>
    allNfts[address as string] || {},
);

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (address, chainId, favorites): FavoriteCollectible[] =>
    favorites[address as string]?.[chainId] || [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (_state: RootState, collectible: FavoriteCollectibleInput) => collectible,
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
  favoriteCollectibles: CollectiblesState['favorites'],
  selectedAddress: string | undefined,
  chainId: string,
): FavoriteCollectible[] =>
  favoriteCollectibles[selectedAddress as string]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = ActionType.ADD_FAVORITE_COLLECTIBLE;
export const REMOVE_FAVORITE_COLLECTIBLE =
  ActionType.REMOVE_FAVORITE_COLLECTIBLE;
export const SHOW_NFT_FETCHING_LOADER = ActionType.SHOW_NFT_FETCHING_LOADER;
export const HIDE_NFT_FETCHING_LOADER = ActionType.HIDE_NFT_FETCHING_LOADER;

export const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

/**
 * Reads the un-drafted state so the legacy output can be rebuilt without
 * mutating (frozen) arrays reachable from the previous state.
 */
const baseState = (state: CollectiblesState): CollectiblesState =>
  isDraft(state) ? (original(state) as CollectiblesState) : state;

/** Rebuilds `favorites[selectedAddress][chainId]` exactly as the legacy reducer did. */
const withFavorites = (
  state: CollectiblesState,
  selectedAddress: string | undefined,
  chainId: string,
  collectibles: FavoriteCollectible[],
): CollectiblesState => {
  const selectedAddressCollectibles =
    state.favorites[selectedAddress as string] || [];
  return {
    ...state,
    favorites: {
      ...state.favorites,
      [selectedAddress as string]: {
        ...selectedAddressCollectibles,
        [chainId]: collectibles,
      },
    },
  };
};

const collectiblesSlice = createSlice({
  name: 'collectibles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        ActionType.ADD_FAVORITE_COLLECTIBLE,
        (draft, action: AddFavoriteCollectibleAction) => {
          const state = baseState(draft);
          const { selectedAddress, chainId, collectible } = action;
          const collectibles = getFavoritesCollectibles(
            state.favorites,
            selectedAddress,
            chainId,
          ).slice();
          collectibles.push({
            tokenId: collectible.tokenId,
            address: collectible.address,
          });
          return withFavorites(state, selectedAddress, chainId, collectibles);
        },
      )
      .addCase(
        ActionType.REMOVE_FAVORITE_COLLECTIBLE,
        (draft, action: RemoveFavoriteCollectibleAction) => {
          const state = baseState(draft);
          const { selectedAddress, chainId, collectible } = action;
          const collectibles = getFavoritesCollectibles(
            state.favorites,
            selectedAddress,
            chainId,
          ).slice();
          const indexToRemove = collectibles.findIndex(
            ({ tokenId, address }) =>
              // TO DO: Remove after moving favorites to controllers.
              compareTokenIds(tokenId, collectible.tokenId) &&
              address === collectible.address,
          );
          // Legacy parity: an unknown NFT gives index -1, which drops the last item.
          collectibles.splice(indexToRemove, 1);
          return withFavorites(state, selectedAddress, chainId, collectibles);
        },
      )
      .addCase(
        ActionType.SHOW_NFT_FETCHING_LOADER,
        (draft, _action: ShowNftFetchingLoaderAction) => ({
          ...baseState(draft),
          isNftFetchingProgress: true,
        }),
      )
      .addCase(
        ActionType.HIDE_NFT_FETCHING_LOADER,
        (draft, _action: HideNftFetchingLoaderAction) => ({
          ...baseState(draft),
          isNftFetchingProgress: false,
        }),
      );
  },
});

export const showNftFetchingLoadingIndicator =
  (): ShowNftFetchingLoaderAction => ({
    type: ActionType.SHOW_NFT_FETCHING_LOADER,
  });

export const hideNftFetchingLoadingIndicator =
  (): HideNftFetchingLoaderAction => ({
    type: ActionType.HIDE_NFT_FETCHING_LOADER,
  });

export default collectiblesSlice.reducer;

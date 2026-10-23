import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE',
  REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE',
  SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER',
  HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER',
}

/** Minimal NFT identity used to (un)favourite a collectible. */
export interface FavoriteCollectibleInput {
  tokenId: string;
  address: string;
}

export interface AddFavoriteCollectibleAction
  extends ReduxAction<ActionType.ADD_FAVORITE_COLLECTIBLE> {
  selectedAddress: string | undefined;
  chainId: string;
  collectible: FavoriteCollectibleInput;
}

export interface RemoveFavoriteCollectibleAction
  extends ReduxAction<ActionType.REMOVE_FAVORITE_COLLECTIBLE> {
  selectedAddress: string | undefined;
  chainId: string;
  collectible: FavoriteCollectibleInput;
}

export type ShowNftFetchingLoaderAction =
  ReduxAction<ActionType.SHOW_NFT_FETCHING_LOADER>;

export type HideNftFetchingLoaderAction =
  ReduxAction<ActionType.HIDE_NFT_FETCHING_LOADER>;

export type Action =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction
  | ShowNftFetchingLoaderAction
  | HideNftFetchingLoaderAction;

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string,
  collectible: FavoriteCollectibleInput,
): AddFavoriteCollectibleAction => ({
  type: ActionType.ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string,
  collectible: FavoriteCollectibleInput,
): RemoveFavoriteCollectibleAction => ({
  type: ActionType.REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

import type { Action as ReduxAction } from 'redux';

export enum ActionType {
  ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE',
  REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE',
}

export interface Collectible {
  tokenId?: string | number;
  address?: string;
}

export interface AddFavoriteCollectibleAction
  extends ReduxAction<ActionType.ADD_FAVORITE_COLLECTIBLE> {
  selectedAddress: string | undefined;
  chainId: string | undefined;
  collectible: Collectible;
}

export interface RemoveFavoriteCollectibleAction
  extends ReduxAction<ActionType.REMOVE_FAVORITE_COLLECTIBLE> {
  selectedAddress: string | undefined;
  chainId: string | undefined;
  collectible: Collectible;
}

export type Action =
  | AddFavoriteCollectibleAction
  | RemoveFavoriteCollectibleAction;

export const addFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string | undefined,
  collectible: Collectible,
): AddFavoriteCollectibleAction => ({
  type: ActionType.ADD_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

export const removeFavoriteCollectible = (
  selectedAddress: string | undefined,
  chainId: string | undefined,
  collectible: Collectible,
): RemoveFavoriteCollectibleAction => ({
  type: ActionType.REMOVE_FAVORITE_COLLECTIBLE,
  selectedAddress,
  chainId,
  collectible,
});

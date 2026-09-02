export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE' as const;
export const REMOVE_FAVORITE_COLLECTIBLE =
  'REMOVE_FAVORITE_COLLECTIBLE' as const;

interface Collectible {
  tokenId: unknown;
  address: unknown;
}

interface FavoriteCollectibleAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE | typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: unknown;
  chainId: unknown;
  collectible: Collectible;
}

export type Action = FavoriteCollectibleAction;

export function addFavoriteCollectible(
  selectedAddress: unknown,
  chainId: unknown,
  collectible: Collectible,
): FavoriteCollectibleAction {
  return {
    type: ADD_FAVORITE_COLLECTIBLE,
    selectedAddress,
    chainId,
    collectible,
  };
}

export function removeFavoriteCollectible(
  selectedAddress: unknown,
  chainId: unknown,
  collectible: Collectible,
): FavoriteCollectibleAction {
  return {
    type: REMOVE_FAVORITE_COLLECTIBLE,
    selectedAddress,
    chainId,
    collectible,
  };
}

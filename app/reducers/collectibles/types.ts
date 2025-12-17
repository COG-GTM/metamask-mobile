/**
 * Favorite collectible reference
 */
export interface FavoriteCollectible {
  tokenId: string;
  address: string;
}

/**
 * Favorites by chain ID
 */
export type FavoritesByChainId = Record<string, FavoriteCollectible[]>;

/**
 * Favorites by address and chain ID
 */
export type FavoritesByAddress = Record<string, FavoritesByChainId>;

/**
 * Collectibles reducer state
 */
export interface CollectiblesState {
  favorites: FavoritesByAddress;
  isNftFetchingProgress: boolean;
}

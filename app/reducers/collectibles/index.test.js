import collectiblesFavoritesReducer, {
  ADD_FAVORITE_COLLECTIBLE,
  REMOVE_FAVORITE_COLLECTIBLE,
  SHOW_NFT_FETCHING_LOADER,
  HIDE_NFT_FETCHING_LOADER,
  showNftFetchingLoadingIndicator,
  hideNftFetchingLoadingIndicator,
} from './index';

describe('collectiblesFavoritesReducer', () => {
  const initialState = {
    favorites: {},
    isNftFetchingProgress: false,
  };

  it('returns initial state', () => {
    const result = collectiblesFavoritesReducer(undefined, { type: 'UNKNOWN' });
    expect(result).toEqual(initialState);
  });

  it('handles ADD_FAVORITE_COLLECTIBLE', () => {
    const action = {
      type: ADD_FAVORITE_COLLECTIBLE,
      selectedAddress: '0x123',
      chainId: '0x1',
      collectible: { tokenId: '1', address: '0xNFT' },
    };
    const result = collectiblesFavoritesReducer(initialState, action);
    expect(result.favorites['0x123']['0x1']).toEqual([
      { tokenId: '1', address: '0xNFT' },
    ]);
  });

  it('handles REMOVE_FAVORITE_COLLECTIBLE', () => {
    const stateWithFavorite = {
      ...initialState,
      favorites: {
        '0x123': {
          '0x1': [{ tokenId: '1', address: '0xNFT' }],
        },
      },
    };
    const action = {
      type: REMOVE_FAVORITE_COLLECTIBLE,
      selectedAddress: '0x123',
      chainId: '0x1',
      collectible: { tokenId: '1', address: '0xNFT' },
    };
    const result = collectiblesFavoritesReducer(stateWithFavorite, action);
    expect(result.favorites['0x123']['0x1']).toEqual([]);
  });

  it('handles SHOW_NFT_FETCHING_LOADER', () => {
    const result = collectiblesFavoritesReducer(initialState, {
      type: SHOW_NFT_FETCHING_LOADER,
    });
    expect(result.isNftFetchingProgress).toBe(true);
  });

  it('handles HIDE_NFT_FETCHING_LOADER', () => {
    const stateWithLoader = { ...initialState, isNftFetchingProgress: true };
    const result = collectiblesFavoritesReducer(stateWithLoader, {
      type: HIDE_NFT_FETCHING_LOADER,
    });
    expect(result.isNftFetchingProgress).toBe(false);
  });

  it('showNftFetchingLoadingIndicator returns correct action', () => {
    expect(showNftFetchingLoadingIndicator()).toEqual({
      type: SHOW_NFT_FETCHING_LOADER,
    });
  });

  it('hideNftFetchingLoadingIndicator returns correct action', () => {
    expect(hideNftFetchingLoadingIndicator()).toEqual({
      type: HIDE_NFT_FETCHING_LOADER,
    });
  });

  it('handles adding multiple favorites', () => {
    let state = initialState;
    state = collectiblesFavoritesReducer(state, {
      type: ADD_FAVORITE_COLLECTIBLE,
      selectedAddress: '0x123',
      chainId: '0x1',
      collectible: { tokenId: '1', address: '0xNFT1' },
    });
    state = collectiblesFavoritesReducer(state, {
      type: ADD_FAVORITE_COLLECTIBLE,
      selectedAddress: '0x123',
      chainId: '0x1',
      collectible: { tokenId: '2', address: '0xNFT2' },
    });
    expect(state.favorites['0x123']['0x1']).toHaveLength(2);
  });
});

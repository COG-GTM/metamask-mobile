import {
  selectBrowserBookmarksWithType,
  selectBrowserHistoryWithType,
} from './browser';
import { UrlAutocompleteCategory } from '../components/UI/UrlAutocomplete';
import type { RootState } from '../reducers';

const makeState = (overrides: Partial<RootState>) =>
  ({
    browser: { history: [] },
    bookmarks: [],
    ...overrides,
  } as unknown as RootState);

describe('selectBrowserHistoryWithType', () => {
  it('reverses history and tags each item with the Recents category', () => {
    const state = makeState({
      browser: {
        history: [
          { url: 'https://a.io', name: 'A' },
          { url: 'https://b.io', name: 'B' },
        ],
      },
    } as unknown as Partial<RootState>);

    const result = selectBrowserHistoryWithType(state);
    expect(result).toEqual([
      {
        url: 'https://b.io',
        name: 'B',
        category: UrlAutocompleteCategory.Recents,
      },
      {
        url: 'https://a.io',
        name: 'A',
        category: UrlAutocompleteCategory.Recents,
      },
    ]);
  });

  it('returns an empty array when history is empty', () => {
    expect(selectBrowserHistoryWithType(makeState({}))).toEqual([]);
  });
});

describe('selectBrowserBookmarksWithType', () => {
  it('tags each bookmark with the Favorites category preserving order', () => {
    const state = makeState({
      bookmarks: [
        { url: 'https://a.io', name: 'A' },
        { url: 'https://b.io', name: 'B' },
      ],
    } as unknown as Partial<RootState>);

    const result = selectBrowserBookmarksWithType(state);
    expect(result).toEqual([
      {
        url: 'https://a.io',
        name: 'A',
        category: UrlAutocompleteCategory.Favorites,
      },
      {
        url: 'https://b.io',
        name: 'B',
        category: UrlAutocompleteCategory.Favorites,
      },
    ]);
  });
});

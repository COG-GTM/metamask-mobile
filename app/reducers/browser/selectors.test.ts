import { selectBrowserHistory, selectSearchEngine } from './selectors';
import { RootState } from '..';

describe('browser selectors', () => {
  const state = {
    browser: { history: [{ url: 'https://a.com', name: 'A' }] },
    settings: { searchEngine: 'DuckDuckGo' },
  } as unknown as RootState;

  it('selects browser history', () => {
    expect(selectBrowserHistory(state)).toEqual([
      { url: 'https://a.com', name: 'A' },
    ]);
  });

  it('selects the search engine', () => {
    expect(selectSearchEngine(state)).toBe('DuckDuckGo');
  });
});

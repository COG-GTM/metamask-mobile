import {
  selectBrowserHistory,
  selectSearchEngine,
} from './selectors';
import type { RootState } from '..';

describe('browser reducer selectors', () => {
  it('selectBrowserHistory returns state.browser.history', () => {
    const history = [{ url: 'https://a.io', name: 'A' }];
    const state = {
      browser: { history },
      settings: { searchEngine: 'Google' },
    } as unknown as RootState;
    expect(selectBrowserHistory(state)).toBe(history);
  });

  it('selectSearchEngine returns state.settings.searchEngine', () => {
    const state = {
      browser: { history: [] },
      settings: { searchEngine: 'DuckDuckGo' },
    } as unknown as RootState;
    expect(selectSearchEngine(state)).toBe('DuckDuckGo');
  });
});

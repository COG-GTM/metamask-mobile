import { selectBrowserHistory, selectSearchEngine } from './selectors';
import { RootState } from '..';

describe('browser selectors', () => {
  describe('selectBrowserHistory', () => {
    it('should return browser history from state', () => {
      const history = [
        { url: 'https://example.com', name: 'Example' },
        { url: 'https://metamask.io', name: 'MetaMask' },
      ];
      const state = {
        browser: { history },
      } as unknown as RootState;
      expect(selectBrowserHistory(state)).toBe(history);
    });

    it('should return empty array when history is empty', () => {
      const state = {
        browser: { history: [] },
      } as unknown as RootState;
      expect(selectBrowserHistory(state)).toEqual([]);
    });
  });

  describe('selectSearchEngine', () => {
    it('should return the selected search engine', () => {
      const state = {
        settings: { searchEngine: 'Google' },
      } as unknown as RootState;
      expect(selectSearchEngine(state)).toBe('Google');
    });

    it('should return DuckDuckGo when set', () => {
      const state = {
        settings: { searchEngine: 'DuckDuckGo' },
      } as unknown as RootState;
      expect(selectSearchEngine(state)).toBe('DuckDuckGo');
    });
  });
});

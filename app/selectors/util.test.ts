import { createDeepEqualSelector } from './util';

describe('selector utils', () => {
  describe('createDeepEqualSelector', () => {
    it('is a function', () => {
      expect(typeof createDeepEqualSelector).toBe('function');
    });

    it('creates a selector that uses deep equality', () => {
      const inputSelector = (state: { data: { value: number } }) => state.data;
      const selector = createDeepEqualSelector(
        inputSelector,
        (data) => data.value * 2,
      );

      const state1 = { data: { value: 5 } };
      expect(selector(state1)).toBe(10);

      // Same deep value should return memoized result
      const state2 = { data: { value: 5 } };
      expect(selector(state2)).toBe(10);
    });

    it('returns new result when deep value changes', () => {
      const inputSelector = (state: { data: { value: number } }) => state.data;
      const selector = createDeepEqualSelector(
        inputSelector,
        (data) => data.value * 2,
      );

      expect(selector({ data: { value: 5 } })).toBe(10);
      expect(selector({ data: { value: 10 } })).toBe(20);
    });
  });
});

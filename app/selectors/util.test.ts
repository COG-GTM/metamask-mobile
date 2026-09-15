import { createOutputDeepEqualSelector } from './util';

describe('createOutputDeepEqualSelector', () => {
  it('returns the previous result reference for a deeply equal output', () => {
    const selectValue = (state: { value: { nested: boolean } }) => state.value;
    const combine = jest.fn((value: { nested: boolean }) => ({ ...value }));
    const selector = createOutputDeepEqualSelector(selectValue, combine);

    const result1 = selector({ value: { nested: true } });
    const result2 = selector({ value: { nested: true } });

    expect(result2).toBe(result1);
  });

  it('recomputes on input reference changes while preserving the previous result', () => {
    const selectValue = (state: { value: { nested: boolean } }) => state.value;
    const combine = jest.fn((value: { nested: boolean }) => ({ ...value }));
    const selector = createOutputDeepEqualSelector(selectValue, combine);

    const result1 = selector({ value: { nested: true } });
    const result2 = selector({ value: { nested: true } });

    expect(combine).toHaveBeenCalledTimes(2);
    expect(result2).toBe(result1);
  });

  it('returns a new result reference when the output differs', () => {
    const selectValue = (state: { value: { nested: boolean } }) => state.value;
    const combine = jest.fn((value: { nested: boolean }) => ({ ...value }));
    const selector = createOutputDeepEqualSelector(selectValue, combine);

    const result1 = selector({ value: { nested: true } });
    const result2 = selector({ value: { nested: false } });

    expect(result2).not.toBe(result1);
  });
});

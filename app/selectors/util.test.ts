import { createDeepEqualSelector } from './util';

describe('createDeepEqualSelector', () => {
  it('memoizes by deep equality rather than reference equality', () => {
    const computation = jest.fn((value: number[]) => value.reduce((a, b) => a + b, 0));
    const selector = createDeepEqualSelector(
      (state: { value: number[] }) => state.value,
      computation,
    );

    const first = selector({ value: [1, 2, 3] });
    // Different reference but deeply equal input → should reuse cached value
    const second = selector({ value: [1, 2, 3] });

    expect(first).toBe(6);
    expect(second).toBe(6);
    expect(computation).toHaveBeenCalledTimes(1);
  });

  it('recomputes when deep equality differs', () => {
    const computation = jest.fn((value: number[]) => value.length);
    const selector = createDeepEqualSelector(
      (state: { value: number[] }) => state.value,
      computation,
    );

    selector({ value: [1, 2] });
    selector({ value: [1, 2, 3] });

    expect(computation).toHaveBeenCalledTimes(2);
  });
});

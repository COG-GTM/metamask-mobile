import { renderHook } from '@testing-library/react-native';
import { useStableArray } from '.';

describe('useStableArray', () => {
  it('returns the first reference while the content is deep-equal', () => {
    const first = ['0x1', '0xa'];
    const { result, rerender } = renderHook(
      ({ value }: { value: string[] }) => useStableArray(value),
      { initialProps: { value: first } },
    );

    rerender({ value: ['0x1', '0xa'] });
    expect(result.current).toBe(first);

    rerender({ value: [...first] });
    expect(result.current).toBe(first);
  });

  it('returns the new value on the same render the content changes', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string[] | undefined }) => useStableArray(value),
      { initialProps: { value: ['0x1'] as string[] | undefined } },
    );

    const next = ['0x1', '0x89'];
    rerender({ value: next });
    expect(result.current).toBe(next);

    rerender({ value: undefined });
    expect(result.current).toBeUndefined();
  });

  it('compares objects deeply', () => {
    const token = { address: '0xabc', chainId: '0x1' };
    const { result, rerender } = renderHook(
      ({ value }: { value: { address: string; chainId: string }[] }) =>
        useStableArray(value),
      { initialProps: { value: [token] } },
    );

    rerender({ value: [{ ...token }] });
    expect(result.current[0]).toBe(token);

    const other = { address: '0xdef', chainId: '0x1' };
    rerender({ value: [other] });
    expect(result.current[0]).toBe(other);
  });
});

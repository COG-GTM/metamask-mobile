import { act, renderHook } from '@testing-library/react-hooks';
import useModalHandler from './useModalHandler';

describe('useModalHandler', () => {
  it('initialises with the provided initial state', () => {
    const { result } = renderHook(() => useModalHandler(true));
    const [isVisible] = result.current;
    expect(isVisible).toBe(true);
  });

  it('defaults to hidden when no initial state is provided', () => {
    const { result } = renderHook(() => useModalHandler());
    expect(result.current[0]).toBe(false);
  });

  it('showModal makes the modal visible', () => {
    const { result } = renderHook(() => useModalHandler());
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe(true);
  });

  it('hideModal hides the modal', () => {
    const { result } = renderHook(() => useModalHandler(true));
    act(() => {
      result.current[3]();
    });
    expect(result.current[0]).toBe(false);
  });

  it('toggleModal toggles visibility', () => {
    const { result } = renderHook(() => useModalHandler());
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(false);
  });
});

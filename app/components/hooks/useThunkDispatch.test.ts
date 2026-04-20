import { renderHook } from '@testing-library/react-hooks';
import useThunkDispatch from './useThunkDispatch';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

describe('useThunkDispatch', () => {
  it('returns the redux dispatch function', () => {
    const { result } = renderHook(() => useThunkDispatch());
    expect(result.current).toBe(mockDispatch);
  });
});

import { renderHook } from '@testing-library/react-hooks';
import { useNavigation } from '@react-navigation/native';

import { getNavbar } from '../../components/UI/navbar/navbar';
import { useConfirmActions } from '../useConfirmActions';
import useNavbar from './useNavbar';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}));

jest.mock('../../components/UI/navbar/navbar', () => ({
  getNavbar: jest.fn()
}));

jest.mock('../useConfirmActions', () => ({
  useConfirmActions: jest.fn()
}));

describe('useNavbar', () => {
  const mockSetOptions = jest.fn();
  const mockOnReject = jest.fn();
  const mockTitle = 'Test Title';

  beforeEach(() => {
    jest.clearAllMocks();

    useNavigation.mockReturnValue({
      setOptions: mockSetOptions
    });

    useConfirmActions.mockReturnValue({
      onReject: mockOnReject
    });

    getNavbar.mockReturnValue({
      headerTitle: () => null,
      headerLeft: () => null
    });
  });

  it('should call setOptions with the correct navbar configuration', () => {
    renderHook(() => useNavbar(mockTitle));

    expect(useNavigation).toHaveBeenCalled();
    expect(useConfirmActions).toHaveBeenCalled();
    expect(getNavbar).toHaveBeenCalledWith({
      title: mockTitle,
      onReject: mockOnReject,
      addBackButton: true,
      theme: expect.any(Object)
    });
    expect(mockSetOptions).toHaveBeenCalledWith(
      getNavbar({
        title: mockTitle,
        onReject: mockOnReject,
        addBackButton: true,
        theme: {}
      })
    );
  });

  it('should update navigation options when title changes', () => {
    const { rerender } = renderHook(({ title }) => useNavbar(title), {
      initialProps: { title: 'Initial Title' }
    });

    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    rerender({ title: 'Updated Title' });

    expect(mockSetOptions).toHaveBeenCalledTimes(2);
    expect(getNavbar).toHaveBeenLastCalledWith({
      title: 'Updated Title',
      onReject: mockOnReject,
      addBackButton: true,
      theme: expect.any(Object)
    });
  });

  it('should update navigation options when onReject changes', () => {
    const newOnReject = jest.fn();
    useConfirmActions.mockReturnValue({
      onReject: newOnReject
    });

    renderHook(() => useNavbar(mockTitle));

    expect(getNavbar).toHaveBeenCalledWith({
      title: mockTitle,
      onReject: newOnReject,
      addBackButton: true,
      theme: expect.any(Object)
    });
  });
});
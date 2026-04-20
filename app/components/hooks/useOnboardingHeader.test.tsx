import { renderHook } from '@testing-library/react-hooks';
import { useOnboardingHeader } from './useOnboardingHeader';

const mockSetOptions = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    setOptions: mockSetOptions,
    goBack: mockGoBack,
  }),
}));

describe('useOnboardingHeader', () => {
  beforeEach(() => {
    mockSetOptions.mockReset();
    mockGoBack.mockReset();
  });

  it('sets navigation headerLeft and headerTitle on mount', () => {
    renderHook(() => useOnboardingHeader('My Title'));

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
    const options = mockSetOptions.mock.calls[0][0];
    expect(options.headerLeft).toBeInstanceOf(Function);
    expect(options.headerTitle).toBeInstanceOf(Function);
  });

  it('renders a functional back button and title', () => {
    renderHook(() => useOnboardingHeader('Another'));

    const options = mockSetOptions.mock.calls[0][0];
    const backButton = options.headerLeft();
    const title = options.headerTitle();
    // Calling goBack via the back button's onPress prop.
    backButton.props.onPress();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(title).toBeTruthy();
  });
});

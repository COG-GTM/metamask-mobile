import { renderHook } from '@testing-library/react-hooks';
import { InteractionManager } from 'react-native';
import useEnableAutomaticSecurityChecks from './useEnableAutomaticSecurityChecks';

const mockNavigate = jest.fn();
const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock(
  '../../UI/EnableAutomaticSecurityChecksModal/EnableAutomaticSecurityChecksModal',
  () => ({
    createEnableAutomaticSecurityChecksModalNavDetails: () => [
      'ROOT_MODAL_FLOW',
      { screen: 'ENABLE_AUTOMATIC_SECURITY_CHECKS' },
    ],
  }),
);

describe('useEnableAutomaticSecurityChecks', () => {
  let runAfterInteractionsSpy: jest.SpyInstance;

  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseSelector.mockReset();
    runAfterInteractionsSpy = jest
      .spyOn(InteractionManager, 'runAfterInteractions')
      .mockImplementation((cb) => {
        if (typeof cb === 'function') cb();
        return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() } as ReturnType<
          typeof InteractionManager.runAfterInteractions
        >;
      });
  });

  afterEach(() => {
    runAfterInteractionsSpy.mockRestore();
  });

  it('navigates to the modal when the user has not selected automatic security checks', () => {
    mockUseSelector.mockReturnValue(false);
    renderHook(() => useEnableAutomaticSecurityChecks());
    expect(runAfterInteractionsSpy).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      'ROOT_MODAL_FLOW',
      { screen: 'ENABLE_AUTOMATIC_SECURITY_CHECKS' },
    );
  });

  it('does not navigate when the user has already selected the option', () => {
    mockUseSelector.mockReturnValue(true);
    renderHook(() => useEnableAutomaticSecurityChecks());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

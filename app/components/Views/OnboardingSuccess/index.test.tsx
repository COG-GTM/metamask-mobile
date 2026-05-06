// Third party dependencies.
import React from 'react';

// Internal dependencies.
import OnboardingSuccess from './';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { useNavigation } from '@react-navigation/native';
import {
  useSelector,
  useDispatch,
  type TypedUseSelectorHook,
} from 'react-redux';
import { selectProviderConfig } from '../../../selectors/networkController';
import { OnboardingSuccessSelectorIDs } from '../../../../e2e/selectors/Onboarding/OnboardingSuccess.selectors';
import { SET_COMPLETED_ONBOARDING } from '../../../actions/onboarding';
import { waitFor } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: jest.fn(),
      setOptions: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      dangerouslyGetParent: () => ({
        pop: jest.fn(),
      }),
    }),
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

const mockImportAdditionalAccounts = jest.fn(() => Promise.resolve());
jest.mock(
  '../../../util/importAdditionalAccounts',
  () => () => mockImportAdditionalAccounts(),
);

const mockProviderConfig = {
  type: 'mainnet',
  chainId: '1',
};

const mockedUseSelector = useSelector as unknown as jest.MockedFunction<
  TypedUseSelectorHook<unknown>
>;
const mockedUseDispatch = useDispatch as unknown as jest.MockedFunction<
  typeof useDispatch
>;

describe('OnboardingSuccess', () => {
  it('should render correctly', () => {
    mockedUseSelector.mockImplementation((selector: unknown) => {
      if (selector === selectProviderConfig) return mockProviderConfig;
      return undefined;
    });
    const { toJSON } = renderWithProvider(
      <OnboardingSuccess navigation={useNavigation()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('imports additional accounts and sets completedOnboarding to true when onDone is called', () => {
    mockedUseSelector.mockImplementation((selector: unknown) => {
      if (selector === selectProviderConfig) return mockProviderConfig;
      return undefined;
    });
    const mockDispatch = jest.fn();
    mockedUseDispatch.mockImplementation(() => mockDispatch);

    const { getByTestId } = renderWithProvider(
      <OnboardingSuccess navigation={useNavigation()} onDone={jest.fn()} />,
    );
    const button = getByTestId(OnboardingSuccessSelectorIDs.DONE_BUTTON);
    button.props.onPress();

    waitFor(() => {
      expect(mockImportAdditionalAccounts).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: SET_COMPLETED_ONBOARDING,
        completedOnboarding: true,
      });
    });
  });
});

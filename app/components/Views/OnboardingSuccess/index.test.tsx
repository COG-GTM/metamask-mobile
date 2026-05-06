// Third party dependencies.
import React from 'react';

// Internal dependencies.
import OnboardingSuccess from './';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
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

describe('OnboardingSuccess', () => {
  it('should render correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSelector as unknown as jest.Mock).mockImplementation(
      (selector: unknown) => {
        if (selector === selectProviderConfig) return mockProviderConfig;
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = OnboardingSuccess as any;
    const { toJSON } = renderWithProvider(
      <Component navigation={useNavigation()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('imports additional accounts and sets completedOnboarding to true when onDone is called', () => {
    (useSelector as unknown as jest.Mock).mockImplementation(
      (selector: unknown) => {
        if (selector === selectProviderConfig) return mockProviderConfig;
      },
    );
    const mockDispatch = jest.fn();
    (useDispatch as unknown as jest.Mock).mockImplementation(() => mockDispatch);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = OnboardingSuccess as any;
    const { getByTestId } = renderWithProvider(
      <Component navigation={useNavigation()} onDone={jest.fn()} />,
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

// Third party dependencies.
import React from 'react';
import { Linking } from 'react-native';
// Internal dependencies.
import ManageNetworks from './ManageNetworks';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { selectNetworkName } from '../../../selectors/networkInfos';
import AppConstants from '../../../core/AppConstants';
import { fireEvent } from '@testing-library/react-native';

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  openURL: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockNetworkName = 'Ethereum Main Network';

const mockedUseSelector = useSelector as unknown as jest.Mock;

describe('ManageNetworks', () => {
  it('should render correctly', () => {
    mockedUseSelector.mockImplementation((selector: unknown) => {
      if (selector === selectNetworkName) return mockNetworkName;
      return undefined;
    });
    useNavigation();
    const { toJSON } = renderWithProvider(<ManageNetworks />);
    expect(toJSON()).toMatchSnapshot();
  });

  it.each([
    [
      {
        link: AppConstants.URLS.PRIVACY_POLICY_2024,
        testId: 'privacy-policy-link',
      },
      {
        link: AppConstants.URLS.ADD_SOLANA_ACCOUNT_PRIVACY_POLICY,
        testId: 'solana-privacy-policy-link',
      },
    ],
  ])(
    'opens link %link',
    ({ link, testId }: { link: string; testId: string }) => {
      mockedUseSelector.mockImplementation((selector: unknown) => {
        if (selector === selectNetworkName) return mockNetworkName;
        return undefined;
      });
      useNavigation();
      const { getByTestId } = renderWithProvider(<ManageNetworks />);
      const button = getByTestId(testId);
      fireEvent.press(button);
      expect(Linking.openURL).toHaveBeenCalledWith(link);
    },
  );
});

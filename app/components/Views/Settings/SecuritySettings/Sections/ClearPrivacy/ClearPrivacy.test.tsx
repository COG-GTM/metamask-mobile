import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import ClearPrivacy from './ClearPrivacy';
import { CLEAR_PRIVACY_SECTION } from '../../SecuritySettings.constants';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';
import { ClearPrivacyModalSelectorsIDs } from '../../../../../../../e2e/selectors/Settings/SecurityAndPrivacy/ClearPrivacyModal.selectors';
import Engine from '../../../../../../core/Engine';
import SDKConnect from '../../../../../../core/SDKConnect/SDKConnect';

const mockClearState = jest.fn();
const mockRemoveAll = jest.fn();

jest.mock('@metamask/react-native-button', () => 'MetaMaskButton');

jest.mock('../../../../../UI/ActionModal', () => {
  const ReactLib = jest.requireActual('react');
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  return ({
    modalVisible,
    onConfirmPress,
    onCancelPress,
    children,
  }: {
    modalVisible: boolean;
    onConfirmPress: () => void;
    onCancelPress: () => void;
    children: React.ReactNode;
  }) => {
    if (!modalVisible) return null;
    return ReactLib.createElement(
      View,
      { testID: 'action-modal' },
      children,
      ReactLib.createElement(
        TouchableOpacity,
        { testID: 'action-modal-confirm', onPress: onConfirmPress },
        ReactLib.createElement(Text, null, 'Confirm'),
      ),
      ReactLib.createElement(
        TouchableOpacity,
        { testID: 'action-modal-cancel', onPress: onCancelPress },
        ReactLib.createElement(Text, null, 'Cancel'),
      ),
    );
  };
});

jest.mock('../../../../../../core/Engine', () => ({
  context: {
    PermissionController: {
      clearState: jest.fn(),
    },
  },
}));

jest.mock('../../../../../../core/SDKConnect/SDKConnect', () => ({
  getInstance: jest.fn(() => ({
    removeAll: jest.fn(),
  })),
}));

const initialState = { engine: { backgroundState } };

describe('ClearPrivacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Engine.context.PermissionController.clearState as jest.Mock) = mockClearState;
    (SDKConnect.getInstance as jest.Mock).mockReturnValue({
      removeAll: mockRemoveAll,
    });
  });

  it('renders correctly', () => {
    const { toJSON, getByTestId } = renderWithProvider(<ClearPrivacy />, {
      state: initialState,
    });
    expect(getByTestId(CLEAR_PRIVACY_SECTION)).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('opens the confirmation modal when the clear privacy button is pressed', () => {
    const { getByTestId } = renderWithProvider(<ClearPrivacy />, {
      state: initialState,
    });

    fireEvent.press(
      getByTestId(SecurityPrivacyViewSelectorsIDs.CLEAR_PRIVACY_DATA_BUTTON),
    );

    expect(getByTestId(ClearPrivacyModalSelectorsIDs.CONTAINER)).toBeTruthy();
  });

  it('clears permissions and removes SDK connections when confirmed', () => {
    const { getByTestId } = renderWithProvider(<ClearPrivacy />, {
      state: initialState,
    });

    fireEvent.press(
      getByTestId(SecurityPrivacyViewSelectorsIDs.CLEAR_PRIVACY_DATA_BUTTON),
    );
    fireEvent.press(getByTestId('action-modal-confirm'));

    expect(mockClearState).toHaveBeenCalled();
    expect(mockRemoveAll).toHaveBeenCalled();
  });

  it('closes the modal without clearing when canceled', () => {
    const { getByTestId, queryByTestId } = renderWithProvider(<ClearPrivacy />, {
      state: initialState,
    });

    fireEvent.press(
      getByTestId(SecurityPrivacyViewSelectorsIDs.CLEAR_PRIVACY_DATA_BUTTON),
    );
    fireEvent.press(getByTestId('action-modal-cancel'));

    expect(queryByTestId(ClearPrivacyModalSelectorsIDs.CONTAINER)).toBeNull();
    expect(mockClearState).not.toHaveBeenCalled();
  });
});

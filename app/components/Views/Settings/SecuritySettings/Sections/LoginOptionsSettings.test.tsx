import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import LoginOptionsSettings from './LoginOptionsSettings';
import { LOGIN_OPTIONS } from '../SecuritySettings.constants';
import { Authentication } from '../../../../../core';
import AUTHENTICATION_TYPE from '../../../../../constants/userProperties';
import StorageWrapper from '../../../../../store/storage-wrapper';
import Device from '../../../../../util/device';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';

jest.mock('../../../../../core', () => ({
  Authentication: {
    getType: jest.fn(),
  },
}));

jest.mock('../../../../../store/storage-wrapper', () => ({
  getItem: jest.fn(),
}));

jest.mock('../../../../../util/device', () => ({
  isAndroid: jest.fn(() => false),
  isIos: jest.fn(() => true),
}));

const initialState = { engine: { backgroundState } };

describe('LoginOptionsSettings', () => {
  const onSignWithBiometricsOptionUpdated = jest.fn();
  const onSignWithPasscodeOptionUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Authentication.getType as jest.Mock).mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
      availableBiometryType: undefined,
    });
    (StorageWrapper.getItem as jest.Mock).mockResolvedValue(null);
    (Device.isAndroid as jest.Mock).mockReturnValue(false);
    (Device.isIos as jest.Mock).mockReturnValue(true);
  });

  it('renders the container when there is no biometric option', async () => {
    const { getByTestId } = renderWithProvider(
      <LoginOptionsSettings
        onSignWithBiometricsOptionUpdated={onSignWithBiometricsOptionUpdated}
        onSignWithPasscodeOptionUpdated={onSignWithPasscodeOptionUpdated}
      />,
      { state: initialState },
    );
    await waitFor(() => expect(getByTestId(LOGIN_OPTIONS)).toBeTruthy());
  });

  it('renders correctly', async () => {
    const { toJSON, getByTestId } = renderWithProvider(
      <LoginOptionsSettings
        onSignWithBiometricsOptionUpdated={onSignWithBiometricsOptionUpdated}
        onSignWithPasscodeOptionUpdated={onSignWithPasscodeOptionUpdated}
      />,
      { state: initialState },
    );
    await waitFor(() => expect(getByTestId(LOGIN_OPTIONS)).toBeTruthy());
    expect(toJSON()).toMatchSnapshot();
  });

  it('shows biometrics toggle when biometric auth type is available', async () => {
    (Authentication.getType as jest.Mock).mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
      availableBiometryType: 'FaceID',
    });

    const { getByTestId } = renderWithProvider(
      <LoginOptionsSettings
        onSignWithBiometricsOptionUpdated={onSignWithBiometricsOptionUpdated}
        onSignWithPasscodeOptionUpdated={onSignWithPasscodeOptionUpdated}
      />,
      { state: initialState },
    );

    await waitFor(() =>
      expect(
        getByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE),
      ).toBeTruthy(),
    );
  });

  it('invokes onSignWithBiometricsOptionUpdated when biometrics toggle changes', async () => {
    (Authentication.getType as jest.Mock).mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.BIOMETRIC,
      availableBiometryType: 'FaceID',
    });

    const { getByTestId } = renderWithProvider(
      <LoginOptionsSettings
        onSignWithBiometricsOptionUpdated={onSignWithBiometricsOptionUpdated}
        onSignWithPasscodeOptionUpdated={onSignWithPasscodeOptionUpdated}
      />,
      { state: initialState },
    );

    await waitFor(() =>
      expect(
        getByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE),
      ).toBeTruthy(),
    );

    fireEvent(
      getByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE),
      'onValueChange',
      false,
    );

    await waitFor(() => {
      expect(onSignWithBiometricsOptionUpdated).toHaveBeenCalledWith(false);
    });
  });
});

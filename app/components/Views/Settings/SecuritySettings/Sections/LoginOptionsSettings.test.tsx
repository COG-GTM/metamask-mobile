import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { BIOMETRY_TYPE } from 'react-native-keychain';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import LoginOptionsSettings from './LoginOptionsSettings';
import { Authentication } from '../../../../../core';
import AUTHENTICATION_TYPE from '../../../../../constants/userProperties';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';

jest.mock('../../../../../util/device', () => ({
  isAndroid: () => false,
  isIos: () => true,
}));

describe('LoginOptionsSettings', () => {
  beforeEach(() => {
    jest.spyOn(Authentication, 'getType').mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
      availableBiometryType: BIOMETRY_TYPE.FACE_ID,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderOptions = (
    onSignWithBiometricsOptionUpdated: (enabled: boolean) => Promise<boolean>,
  ) =>
    renderWithProvider(
      <LoginOptionsSettings
        onSignWithBiometricsOptionUpdated={onSignWithBiometricsOptionUpdated}
        onSignWithPasscodeOptionUpdated={jest.fn().mockResolvedValue(false)}
      />,
      { state: {} },
    );

  it('turns the biometrics toggle on when enrollment succeeds', async () => {
    const onBiometrics = jest.fn().mockResolvedValue(true);
    const { findByTestId, getByTestId } = renderOptions(onBiometrics);
    const toggle = await findByTestId(
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
    );

    await act(async () => {
      fireEvent(toggle, 'onValueChange', true);
    });

    expect(onBiometrics).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(
        getByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE).props
          .value,
      ).toBe(true),
    );
  });

  it('leaves the biometrics toggle off when enrollment was cancelled', async () => {
    const onBiometrics = jest.fn().mockResolvedValue(false);
    const { findByTestId, getByTestId } = renderOptions(onBiometrics);
    const toggle = await findByTestId(
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
    );

    await act(async () => {
      fireEvent(toggle, 'onValueChange', true);
    });

    expect(onBiometrics).toHaveBeenCalledWith(true);
    expect(
      getByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE).props
        .value,
    ).toBe(false);
  });
});

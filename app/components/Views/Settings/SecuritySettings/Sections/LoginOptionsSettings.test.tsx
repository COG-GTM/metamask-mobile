import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { BIOMETRY_TYPE } from 'react-native-keychain';
import LoginOptionsSettings from './LoginOptionsSettings';
import { Authentication } from '../../../../../core';
import AUTHENTICATION_TYPE from '../../../../../constants/userProperties';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';

jest.mock('../../../../../core', () => ({
  Authentication: { getType: jest.fn() },
}));

jest.mock('../../../../../util/device', () => ({
  isAndroid: () => false,
  isIos: () => true,
}));

jest.mock('../../../../../store/storage-wrapper', () => ({
  __esModule: true,
  default: { getItem: jest.fn().mockResolvedValue(null) },
}));

describe('LoginOptionsSettings', () => {
  beforeEach(() => {
    (Authentication.getType as jest.Mock).mockResolvedValue({
      currentAuthType: AUTHENTICATION_TYPE.PASSWORD,
      availableBiometryType: BIOMETRY_TYPE.FACE_ID,
    });
  });

  const renderSection = (onSignWithBiometricsOptionUpdated: jest.Mock) =>
    render(
      <LoginOptionsSettings
        onSignWithBiometricsOptionUpdated={onSignWithBiometricsOptionUpdated}
        onSignWithPasscodeOptionUpdated={jest.fn()}
      />,
    );

  it('turns the biometrics toggle back off when enabling is cancelled', async () => {
    const onBiometrics = jest.fn().mockResolvedValue(false);
    const { findByTestId } = renderSection(onBiometrics);
    const toggle = await findByTestId(
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
    );
    expect(toggle.props.value).toBe(false);

    await act(async () => {
      fireEvent(toggle, 'onValueChange', true);
    });

    expect(onBiometrics).toHaveBeenCalledWith(true);
    await waitFor(async () =>
      expect(
        (
          await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE)
        ).props.value,
      ).toBe(false),
    );
  });

  it('keeps the biometrics toggle on when enabling succeeds', async () => {
    const onBiometrics = jest.fn().mockResolvedValue(true);
    const { findByTestId } = renderSection(onBiometrics);
    const toggle = await findByTestId(
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
    );

    await act(async () => {
      fireEvent(toggle, 'onValueChange', true);
    });

    await waitFor(async () =>
      expect(
        (
          await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE)
        ).props.value,
      ).toBe(true),
    );
  });

  it('falls back to the requested state when the handler returns nothing', async () => {
    const onBiometrics = jest.fn().mockResolvedValue(undefined);
    const { findByTestId } = renderSection(onBiometrics);
    const toggle = await findByTestId(
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
    );

    await act(async () => {
      fireEvent(toggle, 'onValueChange', true);
    });

    await waitFor(async () =>
      expect(
        (
          await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE)
        ).props.value,
      ).toBe(true),
    );
  });
});

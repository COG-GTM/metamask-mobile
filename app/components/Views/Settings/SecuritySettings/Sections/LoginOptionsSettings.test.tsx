import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { BIOMETRY_TYPE } from 'react-native-keychain';
import LoginOptionsSettings from './LoginOptionsSettings';
import { Authentication } from '../../../../../core';
import AUTHENTICATION_TYPE from '../../../../../constants/userProperties';
import {
  BIOMETRY_CHOICE_DISABLED,
  PASSCODE_DISABLED,
  TRUE,
} from '../../../../../constants/storage';
import { SecurityPrivacyViewSelectorsIDs } from '../../../../../../e2e/selectors/Settings/SecurityAndPrivacy/SecurityPrivacyView.selectors';

let mockStorage: Record<string, string> = {};

jest.mock('../../../../../core', () => ({
  Authentication: { getType: jest.fn() },
}));

jest.mock('../../../../../util/device', () => ({
  isAndroid: () => false,
  isIos: () => true,
}));

jest.mock('../../../../../store/storage-wrapper', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage?.[key])),
  },
}));

const setAuthState = (
  currentAuthType: AUTHENTICATION_TYPE,
  storage: Record<string, string>,
) => {
  (Authentication.getType as jest.Mock).mockResolvedValue({
    currentAuthType,
    availableBiometryType: BIOMETRY_TYPE.FACE_ID,
  });
  mockStorage = storage;
};

const passwordOnly = () =>
  setAuthState(AUTHENTICATION_TYPE.PASSWORD, {
    [BIOMETRY_CHOICE_DISABLED]: TRUE,
    [PASSCODE_DISABLED]: TRUE,
  });

describe('LoginOptionsSettings', () => {
  const renderSection = (
    onBiometrics: jest.Mock,
    onPasscode: jest.Mock = jest.fn().mockResolvedValue(undefined),
  ) =>
    render(
      <LoginOptionsSettings
        onSignWithBiometricsOptionUpdated={onBiometrics}
        onSignWithPasscodeOptionUpdated={onPasscode}
      />,
    );

  const toggleBiometrics = async (
    findByTestId: ReturnType<typeof render>['findByTestId'],
  ) => {
    const toggle = await findByTestId(
      SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE,
    );
    await act(async () => {
      fireEvent(toggle, 'onValueChange', true);
    });
  };

  it('turns the biometrics toggle back off when the biometric prompt is cancelled', async () => {
    passwordOnly();
    const onBiometrics = jest.fn(async () => passwordOnly());
    const { findByTestId } = renderSection(onBiometrics);

    await toggleBiometrics(findByTestId);

    expect(onBiometrics).toHaveBeenCalledWith(true);
    await waitFor(async () =>
      expect(
        (
          await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE)
        ).props.value,
      ).toBe(false),
    );
  });

  it('shows biometrics on when enabling succeeds', async () => {
    passwordOnly();
    const onBiometrics = jest.fn(async () =>
      setAuthState(AUTHENTICATION_TYPE.BIOMETRIC, {
        [PASSCODE_DISABLED]: TRUE,
      }),
    );
    const { findByTestId } = renderSection(onBiometrics);

    await toggleBiometrics(findByTestId);

    await waitFor(async () =>
      expect(
        (
          await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE)
        ).props.value,
      ).toBe(true),
    );
  });

  it('turns the passcode toggle off when a passcode user cancels the biometric prompt', async () => {
    setAuthState(AUTHENTICATION_TYPE.PASSCODE, {
      [BIOMETRY_CHOICE_DISABLED]: TRUE,
    });
    const onBiometrics = jest.fn(async () => passwordOnly());
    const { findByTestId } = renderSection(onBiometrics);

    await waitFor(async () =>
      expect(
        (
          await findByTestId(
            SecurityPrivacyViewSelectorsIDs.DEVICE_PASSCODE_TOGGLE,
          )
        ).props.value,
      ).toBe(true),
    );

    await toggleBiometrics(findByTestId);

    await waitFor(async () => {
      expect(
        (await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE))
          .props.value,
      ).toBe(false);
      expect(
        (
          await findByTestId(
            SecurityPrivacyViewSelectorsIDs.DEVICE_PASSCODE_TOGGLE,
          )
        ).props.value,
      ).toBe(false);
    });
  });

  it('keeps the toggle unchanged until the handler settles', async () => {
    passwordOnly();
    const onBiometrics = jest.fn(() => new Promise(() => undefined));
    const { findByTestId } = renderSection(onBiometrics);

    await toggleBiometrics(findByTestId);

    expect(
      (await findByTestId(SecurityPrivacyViewSelectorsIDs.BIOMETRICS_TOGGLE))
        .props.value,
    ).toBe(false);
  });
});

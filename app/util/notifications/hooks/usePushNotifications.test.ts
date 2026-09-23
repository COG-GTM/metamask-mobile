import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
// eslint-disable-next-line import/no-namespace
import * as Actions from '../../../actions/notification/helpers';
// eslint-disable-next-line import/no-namespace
import * as Selectors from '../../../selectors/notifications';
import { renderHookWithProvider } from '../../test/renderWithProvider';
// eslint-disable-next-line import/no-namespace
import * as NotificationServiceModule from '../services/NotificationService';
import Logger from '../../Logger';
import {
  usePushNotificationsToggle,
  UsePushNotificationsToggleProps,
} from './usePushNotifications';

jest.mock('../constants', () => ({
  isNotificationsFeatureEnabled: () => true,
}));

describe('useNotifications - usePushNotificationsToggle()', () => {
  const arrangeMocks = () => {
    const mockSelectEnabled = jest.spyOn(
      Selectors,
      'selectIsMetaMaskPushNotificationsEnabled',
    );
    const mockRequestPermission = jest
      .spyOn(NotificationServiceModule, 'requestPushPermissions')
      .mockResolvedValue(true);
    const mockHasPermission = jest
      .spyOn(NotificationServiceModule, 'hasPushPermission')
      .mockResolvedValue(true);
    const mockEnablePushNotifications = jest
      .spyOn(Actions, 'enablePushNotifications')
      .mockResolvedValue(undefined);
    const mockDisablePushNotifications = jest
      .spyOn(Actions, 'disablePushNotifications')
      .mockResolvedValue(undefined);
    const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation();

    return {
      mockSelectEnabled,
      mockRequestPermission,
      mockHasPermission,
      mockEnablePushNotifications,
      mockDisablePushNotifications,
      mockLoggerError,
    };
  };

  afterEach(() => jest.restoreAllMocks());

  type Mocks = ReturnType<typeof arrangeMocks>;
  const arrangeActEnableFlow = async (
    overrideMocks?: (mocks: Mocks) => void,
    state?: UsePushNotificationsToggleProps,
  ) => {
    // Arrange
    const mocks = arrangeMocks();
    overrideMocks?.(mocks);

    // Act
    const hook = renderHookWithProvider(() =>
      usePushNotificationsToggle(state),
    );
    let result;
    await act(async () => {
      result = await hook.result.current.togglePushNotification(true);
    });

    return { mocks, hook, result };
  };

  it('enable push notifications successfully', async () => {
    const { mocks, result } = await arrangeActEnableFlow();
    expect(result).toBe('success');
    await waitFor(() => expect(mocks.mockRequestPermission).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.mockEnablePushNotifications).toHaveBeenCalled(),
    );
    expect(mocks.mockSelectEnabled).toHaveBeenCalled();
    expect(mocks.mockDisablePushNotifications).not.toHaveBeenCalled();
  });

  it('reports permission-denied and logs if requesting push permissions fails', async () => {
    const { mocks, result } = await arrangeActEnableFlow((m) =>
      m.mockRequestPermission.mockRejectedValue(new Error('TEST ERROR')),
    );
    expect(result).toBe('permission-denied');
    await waitFor(() => expect(mocks.mockRequestPermission).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.mockEnablePushNotifications).not.toHaveBeenCalled(),
    );
    expect(mocks.mockLoggerError).toHaveBeenCalled();
  });

  it('reports permission-denied if push permissions are not granted', async () => {
    const { mocks, result } = await arrangeActEnableFlow((m) =>
      m.mockRequestPermission.mockResolvedValue(false),
    );
    expect(result).toBe('permission-denied');
    expect(mocks.mockEnablePushNotifications).not.toHaveBeenCalled();
    expect(mocks.mockLoggerError).not.toHaveBeenCalled();
  });

  it('reports enable-failed and logs if enable push notifications action fails', async () => {
    const { mocks, result } = await arrangeActEnableFlow((m) =>
      m.mockEnablePushNotifications.mockRejectedValue(new Error('TEST ERROR')),
    );
    expect(result).toBe('enable-failed');
    await waitFor(() => expect(mocks.mockRequestPermission).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.mockEnablePushNotifications).toHaveBeenCalled(),
    );
    expect(mocks.mockLoggerError).toHaveBeenCalled();
  });

  it('does not nudge for push notifications enablement', async () => {
    const { mocks } = await arrangeActEnableFlow(undefined, {
      nudgeEnablePush: false,
    });
    await waitFor(() => expect(mocks.mockHasPermission).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.mockEnablePushNotifications).toHaveBeenCalled(),
    );
  });

  const arrangeActDisableFlow = async (
    overrideMocks?: (mocks: Mocks) => void,
  ) => {
    // Arrange
    const mocks = arrangeMocks();
    overrideMocks?.(mocks);

    // Act
    const hook = renderHookWithProvider(() => usePushNotificationsToggle());
    let result;
    await act(async () => {
      result = await hook.result.current.togglePushNotification(false);
    });

    return { mocks, hook, result };
  };

  it('disable push notifications successfully', async () => {
    const { mocks } = await arrangeActDisableFlow();
    await waitFor(() =>
      expect(mocks.mockDisablePushNotifications).toHaveBeenCalled(),
    );
    expect(mocks.mockSelectEnabled).toHaveBeenCalled();
    expect(mocks.mockEnablePushNotifications).not.toHaveBeenCalled();
    expect(mocks.mockRequestPermission).not.toHaveBeenCalled();
  });

  it('reports disable-failed and logs if disable push notifications action fails', async () => {
    const { mocks, result } = await arrangeActDisableFlow((m) =>
      m.mockDisablePushNotifications.mockRejectedValue(new Error('TEST ERROR')),
    );
    expect(result).toBe('disable-failed');
    await waitFor(() =>
      expect(mocks.mockDisablePushNotifications).toHaveBeenCalled(),
    );
    expect(mocks.mockLoggerError).toHaveBeenCalled();
  });
});

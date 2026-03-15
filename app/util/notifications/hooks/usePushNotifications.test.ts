import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
// eslint-disable-next-line import/no-namespace
import * as Actions from '../../../actions/notification/helpers';
// eslint-disable-next-line import/no-namespace
import * as Selectors from '../../../selectors/notifications';
import { renderHookWithProvider } from '../../test/renderWithProvider';
// eslint-disable-next-line import/no-namespace
import * as NotificationServiceModule from '../services/NotificationService';
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
    const mockRequestPermission = jest.spyOn(
      NotificationServiceModule,
      'requestPushPermissions',
    );
    const mockHasPermission = jest.spyOn(
      NotificationServiceModule,
      'hasPushPermission',
    );
    const mockEnablePushNotifications = jest.spyOn(
      Actions,
      'enablePushNotifications',
    );
    const mockDisablePushNotifications = jest.spyOn(
      Actions,
      'disablePushNotifications',
    );

    return {
      mockSelectEnabled,
      mockRequestPermission,
      mockHasPermission,
      mockEnablePushNotifications,
      mockDisablePushNotifications,
    };
  };

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
    await act(() => hook.result.current.togglePushNotification(true));

    return { mocks, hook };
  };

  it('enable push notifications successfully', async () => {
    const { mocks } = await arrangeActEnableFlow();
    await waitFor(() => expect(mocks.mockRequestPermission).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.mockEnablePushNotifications).toHaveBeenCalled(),
    );
    expect(mocks.mockSelectEnabled).toHaveBeenCalled();
    expect(mocks.mockDisablePushNotifications).not.toHaveBeenCalled();
  });

  it('enable push notifications bails if fails to request push permissions', async () => {
    const { mocks } = await arrangeActEnableFlow((m) =>
      m.mockRequestPermission.mockRejectedValue(new Error('TEST ERROR')),
    );
    await waitFor(() => expect(mocks.mockRequestPermission).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.mockEnablePushNotifications).not.toHaveBeenCalled(),
    );
  });

  it('silently fails if enable push notifications action fails', async () => {
    const { mocks } = await arrangeActEnableFlow((m) =>
      m.mockEnablePushNotifications.mockRejectedValue(new Error('TEST ERROR')),
    );
    await waitFor(() => expect(mocks.mockRequestPermission).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.mockEnablePushNotifications).toHaveBeenCalled(),
    );
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
    await act(() => hook.result.current.togglePushNotification(false));

    return { mocks, hook };
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

  it('silently fails if disable push notifications action fails', async () => {
    const { mocks } = await arrangeActDisableFlow((m) =>
      m.mockDisablePushNotifications.mockRejectedValue(new Error('TEST ERROR')),
    );
    await waitFor(() =>
      expect(mocks.mockDisablePushNotifications).toHaveBeenCalled(),
    );
  });
});

describe('usePushNotifications - race conditions', () => {
  const arrangeMocks = () => {
    const mockSelectEnabled = jest.spyOn(
      Selectors,
      'selectIsMetaMaskPushNotificationsEnabled',
    );
    const mockRequestPermission = jest.spyOn(
      NotificationServiceModule,
      'requestPushPermissions',
    );
    const mockHasPermission = jest.spyOn(
      NotificationServiceModule,
      'hasPushPermission',
    );
    const mockEnablePushNotifications = jest.spyOn(
      Actions,
      'enablePushNotifications',
    );
    const mockDisablePushNotifications = jest.spyOn(
      Actions,
      'disablePushNotifications',
    );

    return {
      mockSelectEnabled,
      mockRequestPermission,
      mockHasPermission,
      mockEnablePushNotifications,
      mockDisablePushNotifications,
    };
  };

  it('calling enable then immediately disable invokes both', async () => {
    const mocks = arrangeMocks();
    mocks.mockEnablePushNotifications.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 50)),
    );
    mocks.mockDisablePushNotifications.mockResolvedValue(undefined);

    const hook = renderHookWithProvider(() => usePushNotificationsToggle());

    const enablePromise = act(() =>
      hook.result.current.togglePushNotification(true),
    );
    const disablePromise = act(() =>
      hook.result.current.togglePushNotification(false),
    );

    await Promise.allSettled([enablePromise, disablePromise]);

    expect(mocks.mockRequestPermission).toHaveBeenCalled();
    expect(mocks.mockDisablePushNotifications).toHaveBeenCalled();
  });
});

describe('usePushNotifications - timeout scenarios', () => {
  it('handles enablePushNotifications that never resolves', async () => {
    const mockSelectEnabled = jest.spyOn(
      Selectors,
      'selectIsMetaMaskPushNotificationsEnabled',
    );
    jest.spyOn(NotificationServiceModule, 'requestPushPermissions');
    jest.spyOn(NotificationServiceModule, 'hasPushPermission');
    jest
      .spyOn(Actions, 'enablePushNotifications')
      // eslint-disable-next-line no-empty-function
      .mockReturnValue(new Promise(() => {}));
    jest.spyOn(Actions, 'disablePushNotifications');

    const hook = renderHookWithProvider(() => usePushNotificationsToggle());

    // Start enable - should not throw
    act(() => {
      hook.result.current.togglePushNotification(true);
    });

    expect(mockSelectEnabled).toHaveBeenCalled();
  });
});

describe('usePushNotifications - partial failures', () => {
  it('requestPermission succeeds but enablePushNotifications fails', async () => {
    const mockRequestPermission = jest
      .spyOn(NotificationServiceModule, 'requestPushPermissions')
      .mockResolvedValue(true);
    jest.spyOn(NotificationServiceModule, 'hasPushPermission');
    jest.spyOn(Selectors, 'selectIsMetaMaskPushNotificationsEnabled');
    const mockEnablePushNotifications = jest
      .spyOn(Actions, 'enablePushNotifications')
      .mockRejectedValue(new Error('Enable failed'));
    jest.spyOn(Actions, 'disablePushNotifications');

    const hook = renderHookWithProvider(() => usePushNotificationsToggle());
    await act(() => hook.result.current.togglePushNotification(true));

    await waitFor(() =>
      expect(mockRequestPermission).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(mockEnablePushNotifications).toHaveBeenCalled(),
    );
  });
});

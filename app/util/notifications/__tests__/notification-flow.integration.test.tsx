import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
// eslint-disable-next-line import/no-namespace
import * as Actions from '../../../actions/notification/helpers';
// eslint-disable-next-line import/no-namespace
import * as Selectors from '../../../selectors/notifications';
// eslint-disable-next-line import/no-namespace
import * as UsePushNotifications from '../hooks/usePushNotifications';
import { renderHookWithProvider } from '../../test/renderWithProvider';
import {
  useEnableNotifications,
  useDisableNotifications,
  useListNotifications,
  useMarkNotificationAsRead,
  useResetNotifications,
} from '../hooks/useNotifications';
import {
  createMockNotificationEthSent,
  createMockNotificationEthReceived,
} from '../__test-utils__/mock-notifications';

jest.mock('../constants', () => ({
  isNotificationsFeatureEnabled: () => true,
}));

describe('Notification flow integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enable notifications flow', () => {
    it('full flow: enableNotifications dispatches action and updates selector state', async () => {
      const mockTogglePushNotification = jest.fn().mockResolvedValue(true);
      jest
        .spyOn(UsePushNotifications, 'usePushNotificationsToggle')
        .mockReturnValue({
          data: true,
          loading: false,
          togglePushNotification: mockTogglePushNotification,
        });

      const mockEnableNotifications = jest
        .spyOn(Actions, 'enableNotifications')
        .mockResolvedValue(undefined);

      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
        .mockReturnValue(true);

      const hook = renderHookWithProvider(() => useEnableNotifications());

      await act(() => hook.result.current.enableNotifications());

      await waitFor(() => {
        expect(mockTogglePushNotification).toHaveBeenCalledWith(true);
        expect(mockEnableNotifications).toHaveBeenCalled();
      });

      expect(hook.result.current.data).toBe(true);
      expect(hook.result.current.error).toBeNull();
    });
  });

  describe('disable notifications flow', () => {
    it('full flow: disableNotifications dispatches action and reflects in selector state', async () => {
      const mockTogglePushNotification = jest.fn().mockResolvedValue(true);
      jest
        .spyOn(UsePushNotifications, 'usePushNotificationsToggle')
        .mockReturnValue({
          data: false,
          loading: false,
          togglePushNotification: mockTogglePushNotification,
        });

      const mockDisableNotifications = jest
        .spyOn(Actions, 'disableNotifications')
        .mockResolvedValue(undefined);

      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
        .mockReturnValue(false);

      const hook = renderHookWithProvider(() => useDisableNotifications());

      await act(() => hook.result.current.disableNotifications());

      await waitFor(() => {
        expect(mockTogglePushNotification).toHaveBeenCalledWith(false);
        expect(mockDisableNotifications).toHaveBeenCalled();
      });

      expect(hook.result.current.data).toBe(false);
    });
  });

  describe('list notifications flow', () => {
    it('full flow: listNotifications fetches and updates selector data', async () => {
      const mockNotifications = [
        createMockNotificationEthSent(),
        createMockNotificationEthReceived(),
      ];

      const mockFetchNotifications = jest
        .spyOn(Actions, 'fetchNotifications')
        .mockResolvedValue(undefined);

      jest
        .spyOn(Selectors, 'selectIsFetchingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Selectors, 'getNotificationsList')
        .mockReturnValue(mockNotifications);

      const hook = renderHookWithProvider(() => useListNotifications());

      await act(() => hook.result.current.listNotifications());

      await waitFor(() => {
        expect(mockFetchNotifications).toHaveBeenCalled();
      });

      expect(hook.result.current.notificationsData).toEqual(mockNotifications);
      expect(hook.result.current.error).toBeNull();
      expect(hook.result.current.isLoading).toBe(false);
    });

    it('handles fetch error and exposes it via hook state', async () => {
      jest
        .spyOn(Actions, 'fetchNotifications')
        .mockRejectedValue(new Error('Network error'));

      jest
        .spyOn(Selectors, 'selectIsFetchingMetamaskNotifications')
        .mockReturnValue(false);
      jest.spyOn(Selectors, 'getNotificationsList').mockReturnValue([]);

      const hook = renderHookWithProvider(() => useListNotifications());

      await act(() => hook.result.current.listNotifications());

      await waitFor(() => {
        expect(hook.result.current.error).toBeDefined();
      });
    });
  });

  describe('mark notification as read flow', () => {
    it('full flow: markNotificationAsRead dispatches action with correct notifications', async () => {
      const mockNotifications = [
        createMockNotificationEthSent(),
        createMockNotificationEthReceived(),
      ];

      const mockMarkNotificationsAsRead = jest
        .spyOn(Actions, 'markNotificationsAsRead')
        .mockResolvedValue(undefined);

      const hook = renderHookWithProvider(() => useMarkNotificationAsRead());

      await act(() =>
        hook.result.current.markNotificationAsRead(mockNotifications),
      );

      await waitFor(() => {
        expect(mockMarkNotificationsAsRead).toHaveBeenCalledWith(
          mockNotifications,
        );
      });
    });
  });

  describe('reset notifications flow', () => {
    it('full flow: resetNotifications dispatches action', async () => {
      const mockResetNotifications = jest
        .spyOn(Actions, 'resetNotifications')
        .mockResolvedValue(undefined);

      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);

      const hook = renderHookWithProvider(() => useResetNotifications());

      await act(() => hook.result.current.resetNotifications());

      await waitFor(() => {
        expect(mockResetNotifications).toHaveBeenCalled();
      });

      expect(hook.result.current.error).toBeNull();
    });

    it('handles reset error and exposes it via hook state', async () => {
      jest
        .spyOn(Actions, 'resetNotifications')
        .mockRejectedValue(new Error('Reset failed'));

      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);

      const hook = renderHookWithProvider(() => useResetNotifications());

      await act(() => hook.result.current.resetNotifications());

      await waitFor(() => {
        expect(hook.result.current.error).toBeDefined();
      });
    });
  });

  describe('end-to-end enable then list flow', () => {
    it('enables notifications then lists them successfully', async () => {
      // Setup enable mocks
      const mockTogglePushNotification = jest.fn().mockResolvedValue(true);
      jest
        .spyOn(UsePushNotifications, 'usePushNotificationsToggle')
        .mockReturnValue({
          data: true,
          loading: false,
          togglePushNotification: mockTogglePushNotification,
        });

      const mockEnableNotifications = jest
        .spyOn(Actions, 'enableNotifications')
        .mockResolvedValue(undefined);

      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
        .mockReturnValue(true);

      // Setup list mocks
      const mockNotifications = [createMockNotificationEthSent()];
      const mockFetchNotifications = jest
        .spyOn(Actions, 'fetchNotifications')
        .mockResolvedValue(undefined);

      jest
        .spyOn(Selectors, 'selectIsFetchingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Selectors, 'getNotificationsList')
        .mockReturnValue(mockNotifications);

      // Step 1: Enable notifications
      const enableHook = renderHookWithProvider(() => useEnableNotifications());
      await act(() => enableHook.result.current.enableNotifications());

      await waitFor(() => {
        expect(mockEnableNotifications).toHaveBeenCalled();
      });

      // Step 2: List notifications
      const listHook = renderHookWithProvider(() => useListNotifications());
      await act(() => listHook.result.current.listNotifications());

      await waitFor(() => {
        expect(mockFetchNotifications).toHaveBeenCalled();
      });

      expect(listHook.result.current.notificationsData).toEqual(
        mockNotifications,
      );
    });
  });
});

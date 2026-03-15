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

describe('Notification Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enable notifications flow', () => {
    const arrangeFullFlow = () => {
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

      const mockSelectIsUpdating = jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);

      const mockSelectIsEnabled = jest
        .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
        .mockReturnValue(false);

      return {
        mockTogglePushNotification,
        mockEnableNotifications,
        mockSelectIsUpdating,
        mockSelectIsEnabled,
      };
    };

    it('full enable flow: hook invocation -> action dispatch -> state update', async () => {
      const mocks = arrangeFullFlow();

      const { result } = renderHookWithProvider(() => useEnableNotifications());

      // Initially not enabled
      expect(result.current.data).toBe(false);

      // Trigger enable
      await act(async () => {
        await result.current.enableNotifications();
      });

      // Verify action was dispatched
      await waitFor(() =>
        expect(mocks.mockEnableNotifications).toHaveBeenCalled(),
      );

      // Verify push notification toggle was called
      expect(mocks.mockTogglePushNotification).toHaveBeenCalledWith(true);

      // Verify selectors were consulted
      expect(mocks.mockSelectIsUpdating).toHaveBeenCalled();
      expect(mocks.mockSelectIsEnabled).toHaveBeenCalled();
    });

    it('enable flow sets correct loading states throughout lifecycle', async () => {
      const mocks = arrangeFullFlow();

      const { result } = renderHookWithProvider(() => useEnableNotifications());

      // Before enabling, no error
      expect(result.current.error).toBeNull();

      // Trigger enable
      await act(async () => {
        await result.current.enableNotifications();
      });

      // After enabling, still no error
      expect(result.current.error).toBeNull();
      expect(mocks.mockEnableNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('disable notifications flow', () => {
    it('full disable flow: hook invocation -> action dispatch', async () => {
      const mockTogglePushNotification = jest.fn().mockResolvedValue(true);
      jest
        .spyOn(UsePushNotifications, 'usePushNotificationsToggle')
        .mockReturnValue({
          data: true,
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
        .mockReturnValue(true);

      const { result } = renderHookWithProvider(() =>
        useDisableNotifications(),
      );

      await act(async () => {
        await result.current.disableNotifications();
      });

      await waitFor(() =>
        expect(mockDisableNotifications).toHaveBeenCalled(),
      );
      expect(mockTogglePushNotification).toHaveBeenCalledWith(false);
    });
  });

  describe('list and mark as read flow', () => {
    it('fetches notifications then marks them as read', async () => {
      const mockFetchNotifications = jest
        .spyOn(Actions, 'fetchNotifications')
        .mockResolvedValue(undefined);

      const mockNotifications = [
        createMockNotificationEthSent(),
        createMockNotificationEthReceived(),
      ];

      jest
        .spyOn(Selectors, 'selectIsFetchingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Selectors, 'getNotificationsList')
        .mockReturnValue(mockNotifications);

      const mockMarkAsRead = jest
        .spyOn(Actions, 'markNotificationsAsRead')
        .mockImplementation(jest.fn());

      // Step 1: List notifications
      const listHook = renderHookWithProvider(() => useListNotifications());
      await act(async () => {
        await listHook.result.current.listNotifications();
      });

      await waitFor(() =>
        expect(mockFetchNotifications).toHaveBeenCalled(),
      );

      // Step 2: Mark notifications as read
      const markReadHook = renderHookWithProvider(() =>
        useMarkNotificationAsRead(),
      );
      await act(async () => {
        await markReadHook.result.current.markNotificationAsRead(
          mockNotifications,
        );
      });

      await waitFor(() => expect(mockMarkAsRead).toHaveBeenCalled());
      expect(mockMarkAsRead).toHaveBeenCalledWith(mockNotifications);
    });
  });

  describe('reset notifications flow', () => {
    it('reset flow: hook invocation -> action dispatch -> no error', async () => {
      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);
      const mockResetNotifications = jest
        .spyOn(Actions, 'resetNotifications')
        .mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(() => useResetNotifications());

      await act(async () => {
        await result.current.resetNotifications();
      });

      await waitFor(() =>
        expect(mockResetNotifications).toHaveBeenCalled(),
      );
      expect(result.current.error).toBeNull();
    });

    it('reset flow captures error on failure', async () => {
      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Actions, 'resetNotifications')
        .mockRejectedValue(new Error('Reset failed'));

      const { result } = renderHookWithProvider(() => useResetNotifications());

      await act(async () => {
        await result.current.resetNotifications();
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('enable then immediately disable flow', () => {
    it('both actions are dispatched when called sequentially', async () => {
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
      const mockDisableNotifications = jest
        .spyOn(Actions, 'disableNotifications')
        .mockResolvedValue(undefined);

      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
        .mockReturnValue(false);

      const enableHook = renderHookWithProvider(() =>
        useEnableNotifications(),
      );
      const disableHook = renderHookWithProvider(() =>
        useDisableNotifications(),
      );

      // Enable then disable
      await act(async () => {
        await enableHook.result.current.enableNotifications();
      });
      await act(async () => {
        await disableHook.result.current.disableNotifications();
      });

      expect(mockEnableNotifications).toHaveBeenCalledTimes(1);
      expect(mockDisableNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('error recovery flow', () => {
    it('can retry after an enable failure', async () => {
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
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      jest
        .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
        .mockReturnValue(false);
      jest
        .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
        .mockReturnValue(false);

      const { result } = renderHookWithProvider(() => useEnableNotifications());

      // First attempt - fails
      await act(async () => {
        await result.current.enableNotifications();
      });
      expect(result.current.error).toBeDefined();

      // Second attempt - succeeds
      await act(async () => {
        await result.current.enableNotifications();
      });
      expect(result.current.error).toBeNull();
      expect(mockEnableNotifications).toHaveBeenCalledTimes(2);
    });
  });
});

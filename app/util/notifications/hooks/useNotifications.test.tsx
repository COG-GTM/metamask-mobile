import { act, renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';

// eslint-disable-next-line import/no-namespace
import * as Actions from '../../../actions/notification/helpers';
import {
  createMockNotificationEthReceived,
  createMockNotificationEthSent,
} from '../../../components/UI/Notification/__mocks__/mock_notifications';
// eslint-disable-next-line import/no-namespace
import * as Selectors from '../../../selectors/notifications';
import { renderHookWithProvider } from '../../test/renderWithProvider';
import {
  useContiguousLoading,
  useDisableNotifications,
  useEnableNotifications,
  useListNotifications,
  useListNotificationsEffect,
  useMarkNotificationAsRead,
  useResetNotifications,
} from './useNotifications';
// eslint-disable-next-line import/no-namespace
import * as UsePushNotifications from './usePushNotifications';

jest.mock('../constants', () => ({
  isNotificationsFeatureEnabled: () => true,
}));

describe('useNotifications - useListNotifications()', () => {
  const arrangeMocks = () => {
    const mockFetchNotifications = jest.spyOn(Actions, 'fetchNotifications');
    const mockSelectLoading = jest.spyOn(
      Selectors,
      'selectIsFetchingMetamaskNotifications',
    );
    const mockSelectData = jest.spyOn(Selectors, 'getNotificationsList');

    return {
      mockFetchNotifications,
      mockSelectLoading,
      mockSelectData,
    };
  };

  type Mocks = ReturnType<typeof arrangeMocks>;
  const arrangeAct = async (mutateMocks?: (mocks: Mocks) => void) => {
    // Arrange
    const mocks = arrangeMocks();
    mutateMocks?.(mocks);

    // Act
    const hook = renderHookWithProvider(() => useListNotifications());
    await act(() => hook.result.current.listNotifications());
    await waitFor(() =>
      expect(mocks.mockFetchNotifications).toHaveBeenCalled(),
    );

    return { mocks, hook };
  };

  it('successfully invokes action', async () => {
    const { mocks } = await arrangeAct();
    expect(mocks.mockSelectLoading).toHaveBeenCalled();
    expect(mocks.mockSelectData).toHaveBeenCalled();
  });

  it('creates an error when fails', async () => {
    const { hook } = await arrangeAct((m) => {
      m.mockFetchNotifications.mockRejectedValue(new Error('Test Error'));
    });

    expect(hook.result.current.error).toBeDefined();
  });
});

describe('useNotifications - useListNotificationsEffect', () => {
  const arrangeMocks = () => {
    const mockFetchNotifications = jest.spyOn(Actions, 'fetchNotifications');
    const mockSelectLoading = jest.spyOn(
      Selectors,
      'selectIsFetchingMetamaskNotifications',
    );
    const mockSelectData = jest.spyOn(Selectors, 'getNotificationsList');
    const mockSelectIsMetamaskNotificationsEnabled = jest
      .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
      .mockReturnValue(true);

    return {
      mockFetchNotifications,
      mockSelectLoading,
      mockSelectData,
      mockSelectIsMetamaskNotificationsEnabled,
    };
  };

  type Mocks = ReturnType<typeof arrangeMocks>;
  const arrangeAct = async (mutateMocks?: (mocks: Mocks) => void) => {
    // Arrange
    const mocks = arrangeMocks();
    mutateMocks?.(mocks);

    // Act
    const hook = renderHookWithProvider(() => useListNotificationsEffect());

    return { mocks, hook };
  };

  it('invokes list notifications action when notifications is enabled', async () => {
    const { mocks } = await arrangeAct();
    await waitFor(() =>
      expect(mocks.mockFetchNotifications).toHaveBeenCalled(),
    );
  });

  it(`doesn't invoke list notifications action when notifications are disabled`, async () => {
    const { mocks } = await arrangeAct((m) =>
      m.mockSelectIsMetamaskNotificationsEnabled.mockReturnValue(false),
    );
    await waitFor(() =>
      expect(mocks.mockFetchNotifications).not.toHaveBeenCalled(),
    );
  });
});

describe('useNotifications - useEnableNotifications()', () => {
  const arrangeMocks = () => {
    const mockTogglePushNotification = jest.fn().mockResolvedValue(true);
    const mockUsePushNotificationsToggle = jest
      .spyOn(UsePushNotifications, 'usePushNotificationsToggle')
      .mockReturnValue({
        data: true,
        loading: false,
        togglePushNotification: mockTogglePushNotification,
      });
    const mockEnableNotifications = jest.spyOn(Actions, 'enableNotifications');
    const mockSelectLoading = jest.spyOn(
      Selectors,
      'selectIsUpdatingMetamaskNotifications',
    );
    const mockSelectData = jest.spyOn(
      Selectors,
      'selectIsMetamaskNotificationsEnabled',
    );

    return {
      mockTogglePushNotification,
      mockUsePushNotificationsToggle,
      mockEnableNotifications,
      mockSelectLoading,
      mockSelectData,
    };
  };

  type Mocks = ReturnType<typeof arrangeMocks>;
  const arrangeAct = async (mutateMocks?: (mocks: Mocks) => void) => {
    // Arrange
    const mocks = arrangeMocks();
    mutateMocks?.(mocks);

    // Act
    const hook = renderHookWithProvider(() => useEnableNotifications());
    await act(() => hook.result.current.enableNotifications());
    await waitFor(() =>
      expect(mocks.mockEnableNotifications).toHaveBeenCalled(),
    );

    return { mocks, hook };
  };

  it('successfully invokes action', async () => {
    const { mocks } = await arrangeAct();
    expect(mocks.mockUsePushNotificationsToggle).toHaveBeenCalled();
    expect(mocks.mockTogglePushNotification).toHaveBeenCalled();
    expect(mocks.mockSelectLoading).toHaveBeenCalled();
    expect(mocks.mockSelectData).toHaveBeenCalled();
  });

  it('creates an error when fails', async () => {
    const { hook } = await arrangeAct((m) => {
      m.mockEnableNotifications.mockRejectedValue(new Error('Test Error'));
    });

    expect(hook.result.current.error).toBeDefined();
  });
});

describe('useNotifications - useDisableNotifications()', () => {
  const arrangeMocks = () => {
    const mockTogglePushNotification = jest.fn().mockResolvedValue(true);
    const mockUsePushNotificationsToggle = jest
      .spyOn(UsePushNotifications, 'usePushNotificationsToggle')
      .mockReturnValue({
        data: true,
        loading: false,
        togglePushNotification: mockTogglePushNotification,
      });
    const mockDisableNotifications = jest.spyOn(
      Actions,
      'disableNotifications',
    );
    const mockSelectLoading = jest.spyOn(
      Selectors,
      'selectIsUpdatingMetamaskNotifications',
    );
    const mockSelectData = jest.spyOn(
      Selectors,
      'selectIsMetamaskNotificationsEnabled',
    );

    return {
      mockTogglePushNotification,
      mockUsePushNotificationsToggle,
      mockDisableNotifications,
      mockSelectLoading,
      mockSelectData,
    };
  };

  type Mocks = ReturnType<typeof arrangeMocks>;
  const arrangeAct = async (mutateMocks?: (mocks: Mocks) => void) => {
    // Arrange
    const mocks = arrangeMocks();
    mutateMocks?.(mocks);

    // Act
    const hook = renderHookWithProvider(() => useDisableNotifications());
    await act(() => hook.result.current.disableNotifications());
    await waitFor(() =>
      expect(mocks.mockDisableNotifications).toHaveBeenCalled(),
    );

    return { mocks, hook };
  };

  it('successfully invokes action', async () => {
    const { mocks } = await arrangeAct();
    expect(mocks.mockUsePushNotificationsToggle).toHaveBeenCalled();
    expect(mocks.mockTogglePushNotification).toHaveBeenCalled();
    expect(mocks.mockSelectLoading).toHaveBeenCalled();
    expect(mocks.mockSelectData).toHaveBeenCalled();
  });

  it('creates an error when fails', async () => {
    const { hook } = await arrangeAct((m) => {
      m.mockDisableNotifications.mockRejectedValue(new Error('Test Error'));
    });

    expect(hook.result.current.error).toBeDefined();
  });
});

describe('useNotifications - useMarkNotificationAsRead()', () => {
  const arrangeMocks = () => {
    const mockMarkNotificationsAsRead = jest
      .spyOn(Actions, 'markNotificationsAsRead')
      .mockImplementation(jest.fn());
    const mockData = [
      createMockNotificationEthSent(),
      createMockNotificationEthReceived(),
    ];
    return {
      mockMarkNotificationsAsRead,
      mockData,
    };
  };

  it('successfully invokes action', async () => {
    // Arrange
    const mocks = arrangeMocks();

    // Act
    const hook = renderHookWithProvider(() => useMarkNotificationAsRead());
    await act(() => hook.result.current.markNotificationAsRead(mocks.mockData));

    // Assert
    await waitFor(() =>
      expect(mocks.mockMarkNotificationsAsRead).toHaveBeenCalled(),
    );
  });
});

describe('useNotifications - useResetNotifications()', () => {
  const arrangeMocks = () => {
    const mockSelectLoading = jest
      .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
      .mockReturnValue(false);
    const mockResetNotifications = jest.spyOn(Actions, 'resetNotifications');
    return {
      mockSelectLoading,
      mockResetNotifications,
    };
  };

  type Mocks = ReturnType<typeof arrangeMocks>;
  const arrangeAct = async (mutateMocks?: (mocks: Mocks) => void) => {
    // Arrange
    const mocks = arrangeMocks();
    mutateMocks?.(mocks);

    // Act
    const hook = renderHookWithProvider(() => useResetNotifications());
    await act(() => hook.result.current.resetNotifications());
    await waitFor(() =>
      expect(mocks.mockResetNotifications).toHaveBeenCalled(),
    );

    return { mocks, hook };
  };

  it('successfully invokes action', async () => {
    const { mocks } = await arrangeAct();
    expect(mocks.mockSelectLoading).toHaveBeenCalled();
  });

  it('creates an error when fails', async () => {
    const { hook } = await arrangeAct((m) => {
      m.mockResetNotifications.mockRejectedValue(new Error('Test Error'));
    });

    expect(hook.result.current.error).toBeDefined();
  });
});

describe('useNotifications - useContiguousLoading()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  const arrangeHook = (loading1: boolean, loading2: boolean) =>
    renderHook(
      ({ loadingParam1, loadingParam2 }) =>
        useContiguousLoading(loadingParam1, loadingParam2),
      {
        initialProps: { loadingParam1: loading1, loadingParam2: loading2 },
      },
    );

  const assertResultAfterMs = (
    ms: number,
    result: ReturnType<typeof arrangeHook>['result'],
    expectedValue: boolean,
  ) => {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
    expect(result.current).toBe(expectedValue);
  };

  it('returns true when either loadingParam1 or loadingParam2 is true', () => {
    const { result, rerender } = arrangeHook(true, false);
    expect(result.current).toBe(true);

    rerender({ loadingParam1: false, loadingParam2: true });
    expect(result.current).toBe(true);
  });

  it('returns false after both loadingParam1 and loadingParam2 are false and delay has passed', () => {
    const { result, rerender } = arrangeHook(true, false);
    expect(result.current).toBe(true);

    // Toggle both loading states off
    rerender({ loadingParam1: false, loadingParam2: false });
    expect(result.current).toBe(true);

    // Wait for contiguous loading to expire
    assertResultAfterMs(100, result, false);
  });

  it('remains true if loadingParam1 or loadingParam2 becomes true again before delay expires', () => {
    const { result, rerender } = arrangeHook(true, false);
    expect(result.current).toBe(true);

    // Toggle both loading states off
    rerender({ loadingParam1: false, loadingParam2: false });
    expect(result.current).toBe(true);

    // Wait a little, but not long enough to contiguous loading to expire
    assertResultAfterMs(50, result, true);

    // Rerender with loading set to true
    rerender({ loadingParam1: false, loadingParam2: true });
    expect(result.current).toBe(true);

    // Now if we we wait, it should still remain true since loading params are enabled
    assertResultAfterMs(200, result, true);
  });

  it('handles rapid state changes without stale state', () => {
    const { result, rerender } = arrangeHook(false, false);
    expect(result.current).toBe(false);

    // Rapid toggle: on → off → on → off
    rerender({ loadingParam1: true, loadingParam2: false });
    expect(result.current).toBe(true);

    rerender({ loadingParam1: false, loadingParam2: false });
    expect(result.current).toBe(true);

    rerender({ loadingParam1: true, loadingParam2: true });
    expect(result.current).toBe(true);

    rerender({ loadingParam1: false, loadingParam2: false });
    expect(result.current).toBe(true);

    // After all rapid changes settle and delay passes, should be false
    assertResultAfterMs(100, result, false);
  });
});

describe('useNotifications - race conditions', () => {
  it('calling enable then immediately disable does not leave stale state', async () => {
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
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const mockDisableNotifications = jest
      .spyOn(Actions, 'disableNotifications')
      .mockResolvedValue(undefined);
    jest
      .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
      .mockReturnValue(false);
    jest
      .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
      .mockReturnValue(false);

    const enableHook = renderHookWithProvider(() => useEnableNotifications());
    const disableHook = renderHookWithProvider(() => useDisableNotifications());

    // Fire enable and disable in quick succession
    const enablePromise = act(() =>
      enableHook.result.current.enableNotifications(),
    );
    const disablePromise = act(() =>
      disableHook.result.current.disableNotifications(),
    );

    await Promise.allSettled([enablePromise, disablePromise]);

    expect(mockEnableNotifications).toHaveBeenCalledTimes(1);
    expect(mockDisableNotifications).toHaveBeenCalledTimes(1);
  });
});

describe('useNotifications - timeout scenarios', () => {
  it('handles action that never resolves gracefully', async () => {
    const mockTogglePushNotification = jest.fn().mockResolvedValue(true);
    jest
      .spyOn(UsePushNotifications, 'usePushNotificationsToggle')
      .mockReturnValue({
        data: true,
        loading: false,
        togglePushNotification: mockTogglePushNotification,
      });

    // Mock an action that never resolves
    jest
      .spyOn(Actions, 'enableNotifications')
      // eslint-disable-next-line no-empty-function
      .mockReturnValue(new Promise(() => {}));
    jest
      .spyOn(Selectors, 'selectIsUpdatingMetamaskNotifications')
      .mockReturnValue(false);
    jest
      .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
      .mockReturnValue(false);

    const hook = renderHookWithProvider(() => useEnableNotifications());

    // Start the action - it should not throw
    act(() => {
      hook.result.current.enableNotifications();
    });

    // Hook should still be in a valid state (loading or not errored)
    expect(hook.result.current.error).toBeNull();
  });
});

describe('useNotifications - partial failures', () => {
  it('enableNotifications succeeds but togglePushNotification fails', async () => {
    const mockTogglePushNotification = jest
      .fn()
      .mockRejectedValue(new Error('Push toggle failed'));
    jest
      .spyOn(UsePushNotifications, 'usePushNotificationsToggle')
      .mockReturnValue({
        data: false,
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

    // enableNotifications was called successfully
    await waitFor(() =>
      expect(mockEnableNotifications).toHaveBeenCalled(),
    );
    // togglePushNotification was attempted
    expect(mockTogglePushNotification).toHaveBeenCalled();
  });
});

describe('useNotifications - useListNotificationsEffect auto-fetch', () => {
  it('auto-fetches notifications on mount when enabled', async () => {
    const mockFetchNotifications = jest
      .spyOn(Actions, 'fetchNotifications')
      .mockResolvedValue(undefined);
    jest
      .spyOn(Selectors, 'selectIsFetchingMetamaskNotifications')
      .mockReturnValue(false);
    jest.spyOn(Selectors, 'getNotificationsList').mockReturnValue([]);
    jest
      .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
      .mockReturnValue(true);

    renderHookWithProvider(() => useListNotificationsEffect());

    await waitFor(() =>
      expect(mockFetchNotifications).toHaveBeenCalled(),
    );
  });

  it('does not auto-fetch when notifications are disabled', async () => {
    const mockFetchNotifications = jest
      .spyOn(Actions, 'fetchNotifications')
      .mockResolvedValue(undefined);
    jest
      .spyOn(Selectors, 'selectIsFetchingMetamaskNotifications')
      .mockReturnValue(false);
    jest.spyOn(Selectors, 'getNotificationsList').mockReturnValue([]);
    jest
      .spyOn(Selectors, 'selectIsMetamaskNotificationsEnabled')
      .mockReturnValue(false);

    renderHookWithProvider(() => useListNotificationsEffect());

    await waitFor(() =>
      expect(mockFetchNotifications).not.toHaveBeenCalled(),
    );
  });
});

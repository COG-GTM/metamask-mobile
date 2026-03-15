import { waitFor } from '@testing-library/react-native';
import { createMockNotificationEthSent } from '../../../components/UI/Notification/__mocks__/mock_notifications';
import Engine from '../../../core/Engine';
// eslint-disable-next-line import/no-namespace
import * as NotificationSelectorsModule from '../../../selectors/notifications';
import { renderHookWithProvider } from '../../test/renderWithProvider';
import { isNotificationsFeatureEnabled } from '../constants';
import NotificationService from '../services/NotificationService';
import { PressActionId } from '../types';
import { useRegisterPushNotificationsEffect } from './useRegisterPushNotificationsEffect';
import { EventType, Event as NotifeeEvent } from '@notifee/react-native';

const mockedNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: jest.fn().mockImplementation(() => ({
      navigate: mockedNavigate,
    })),
  };
});

jest.mock('../../../core/Engine', () => ({
  __esModule: true,
  default: {
    controllerMessenger: {
      publish: jest.fn(),
    },
  },
}));

jest.mock('../constants', () => ({
  isNotificationsFeatureEnabled: jest.fn(),
}));

const arrangeEngineMocks = () => ({
  mockPublish: jest.mocked(Engine.controllerMessenger.publish),
});

const arrangeNavigationMocks = () => ({
  mockedNavigate,
});

const arrangeSelectorMocks = () => {
  const mockIsNotificationsFeatureEnabled = jest
    .mocked(isNotificationsFeatureEnabled)
    .mockReturnValue(true);

  const mockSelectIsNotificationsFeatureEnabled = jest
    .spyOn(NotificationSelectorsModule, 'selectIsMetamaskNotificationsEnabled')
    .mockReturnValue(true);

  const mockSelectIsPushEnabled = jest
    .spyOn(
      NotificationSelectorsModule,
      'selectIsMetaMaskPushNotificationsEnabled',
    )
    .mockReturnValue(true);

  return {
    mockIsNotificationsFeatureEnabled,
    mockSelectIsNotificationsFeatureEnabled,
    mockSelectIsPushEnabled,
  };
};

export const arrangeNotificationServiceMock = () => {
  const mockGetInitialNotification = jest
    .spyOn(NotificationService, 'getInitialNotification')
    .mockResolvedValue({
      notification: {
        data: { dataStr: JSON.stringify(createMockNotificationEthSent()) },
      },
      pressAction: { id: PressActionId.OPEN_NOTIFICATIONS_VIEW },
    });

  const mockOnBackgroundEvent = jest.spyOn(
    NotificationService,
    'onBackgroundEvent',
  );

  return { mockGetInitialNotification, mockOnBackgroundEvent };
};

describe('useRegisterPushNotificationsEffect - onAppOpenNotification', () => {
  const arrangeMocks = () => {
    const engine = arrangeEngineMocks();
    const navigation = arrangeNavigationMocks();
    const selectors = arrangeSelectorMocks();
    const notifService = arrangeNotificationServiceMock();

    return {
      engine,
      navigation,
      selectors,
      notifService,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invokes click handler', async () => {
    const { selectors, notifService, engine, navigation } = arrangeMocks();

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    expect(selectors.mockIsNotificationsFeatureEnabled).toHaveBeenCalled();
    expect(selectors.mockSelectIsPushEnabled).toHaveBeenCalled();
    expect(
      selectors.mockSelectIsNotificationsFeatureEnabled,
    ).toHaveBeenCalled();
    expect(notifService.mockGetInitialNotification).toHaveBeenCalled();
    await waitFor(() => expect(engine.mockPublish).toHaveBeenCalled());
    await waitFor(() => expect(navigation.mockedNavigate).toHaveBeenCalled());
  });

  it('does not invoke calls if feature not enabled', async () => {
    const { selectors, notifService } = arrangeMocks();
    selectors.mockSelectIsPushEnabled.mockReturnValue(false);

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    expect(
      selectors.mockSelectIsNotificationsFeatureEnabled,
    ).toHaveBeenCalled();
    expect(selectors.mockSelectIsPushEnabled).toHaveBeenCalled();
    expect(notifService.mockGetInitialNotification).not.toHaveBeenCalled();
  });

  it('bails early if unable to get initial notification', async () => {
    const { notifService, engine } = arrangeMocks();
    notifService.mockGetInitialNotification.mockResolvedValue(null);

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    expect(notifService.mockGetInitialNotification).toHaveBeenCalled();
    await waitFor(() => expect(engine.mockPublish).not.toHaveBeenCalled());
  });
});

describe('useRegisterPushNotificationsEffect - onBackgroundEvent', () => {
  const arrangeMocks = () => {
    const engine = arrangeEngineMocks();
    const navigation = arrangeNavigationMocks();
    const selectors = arrangeSelectorMocks();
    const notifService = arrangeNotificationServiceMock();
    notifService.mockGetInitialNotification.mockResolvedValue(null); // Ensure we are testing the correct effect.

    return {
      engine,
      navigation,
      selectors,
      notifService,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('not listen to background events if feature not enabled', async () => {
    const { selectors, notifService } = arrangeMocks();
    selectors.mockSelectIsPushEnabled.mockReturnValue(false);

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    expect(
      selectors.mockSelectIsNotificationsFeatureEnabled,
    ).toHaveBeenCalled();
    expect(selectors.mockSelectIsPushEnabled).toHaveBeenCalled();
    expect(notifService.mockOnBackgroundEvent).not.toHaveBeenCalled();
  });

  const act = async (
    mocks: ReturnType<typeof arrangeMocks>,
    mutateEvent?: (event: NotifeeEvent) => NotifeeEvent,
  ) => {
    expect(mocks.notifService.mockOnBackgroundEvent).toHaveBeenCalled();
    const callMockEvent =
      mocks.notifService.mockOnBackgroundEvent.mock.lastCall?.[0];
    if (!callMockEvent) {
      throw new Error(
        'TEST FAILURE - failed to setup mockOnBackgroundEvent mock',
      );
    }

    let event = {
      type: EventType.PRESS,
      detail: {
        pressAction: { id: PressActionId.OPEN_NOTIFICATIONS_VIEW },
        notification: {
          data: {
            dataStr: JSON.stringify(createMockNotificationEthSent()),
          },
        },
      },
    } as unknown as NotifeeEvent;
    event = mutateEvent?.(event) ?? event;

    await callMockEvent(event);
  };

  it('calls click event on successful background message', async () => {
    const mocks = arrangeMocks();

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    await act(mocks);

    await waitFor(() => expect(mocks.engine.mockPublish).toHaveBeenCalled());
    await waitFor(() =>
      expect(mocks.navigation.mockedNavigate).toHaveBeenCalled(),
    );
  });

  it('bail when there is no notification data string property', async () => {
    const mocks = arrangeMocks();

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    await act(mocks, (e) => {
      delete e.detail.notification?.data?.dataStr;
      return e;
    });

    await waitFor(() =>
      expect(mocks.engine.mockPublish).not.toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(mocks.navigation.mockedNavigate).not.toHaveBeenCalled(),
    );
  });

  it('do nothing is notification is not parseable', async () => {
    const mocks = arrangeMocks();

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    await act(mocks, (e) => {
      if (e.detail.notification?.data) {
        e.detail.notification.data.dataStr = JSON.stringify({
          badData: 'hello_world',
        });
      }
      return e;
    });

    await waitFor(() =>
      expect(mocks.engine.mockPublish).not.toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(mocks.navigation.mockedNavigate).not.toHaveBeenCalled(),
    );
  });
});

describe('useRegisterPushNotificationsEffect - foreground notification events', () => {
  const arrangeMocks = () => {
    const engine = arrangeEngineMocks();
    const navigation = arrangeNavigationMocks();
    const selectors = arrangeSelectorMocks();
    const notifService = arrangeNotificationServiceMock();
    notifService.mockGetInitialNotification.mockResolvedValue(null);

    const mockOnForegroundEvent = jest.spyOn(
      NotificationService,
      'onForegroundEvent',
    );

    const mockIncrementBadgeCount = jest.spyOn(
      NotificationService,
      'incrementBadgeCount',
    );

    const mockHandleNotificationPress = jest.spyOn(
      NotificationService,
      'handleNotificationPress',
    );

    const mockHandleNotificationEvent = jest.spyOn(
      NotificationService,
      'handleNotificationEvent',
    );

    return {
      engine,
      navigation,
      selectors,
      notifService,
      mockOnForegroundEvent,
      mockIncrementBadgeCount,
      mockHandleNotificationPress,
      mockHandleNotificationEvent,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers onBackgroundEvent handler when notifications are enabled', async () => {
    const mocks = arrangeMocks();

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    expect(mocks.notifService.mockOnBackgroundEvent).toHaveBeenCalled();
  });

  it('NotificationService.handleNotificationEvent increments badge on DELIVERED event', async () => {
    const mocks = arrangeMocks();

    await NotificationService.handleNotificationEvent({
      type: EventType.DELIVERED,
      detail: {
        notification: {
          data: {
            dataStr: JSON.stringify(createMockNotificationEthSent()),
          },
        },
      },
    } as unknown as NotifeeEvent);

    expect(mocks.mockIncrementBadgeCount).toHaveBeenCalledWith(1);
  });

  it('NotificationService.handleNotificationEvent calls handleNotificationPress on PRESS event', async () => {
    const mocks = arrangeMocks();

    const mockNotification = {
      id: 'test-id',
      data: {
        dataStr: JSON.stringify(createMockNotificationEthSent()),
      },
    };

    await NotificationService.handleNotificationEvent({
      type: EventType.PRESS,
      detail: {
        pressAction: { id: PressActionId.OPEN_NOTIFICATIONS_VIEW },
        notification: mockNotification,
      },
    } as unknown as NotifeeEvent);

    expect(mocks.mockHandleNotificationPress).toHaveBeenCalled();
  });

  it('foreground PRESS events navigate correctly via background event handler', async () => {
    const mocks = arrangeMocks();

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    // Get the callback registered with onBackgroundEvent
    expect(mocks.notifService.mockOnBackgroundEvent).toHaveBeenCalled();
    const callMockEvent =
      mocks.notifService.mockOnBackgroundEvent.mock.lastCall?.[0];
    if (!callMockEvent) {
      throw new Error('TEST FAILURE - failed to setup mockOnBackgroundEvent mock');
    }

    const event = {
      type: EventType.PRESS,
      detail: {
        pressAction: { id: PressActionId.OPEN_NOTIFICATIONS_VIEW },
        notification: {
          data: {
            dataStr: JSON.stringify(createMockNotificationEthSent()),
          },
        },
      },
    } as unknown as NotifeeEvent;

    await callMockEvent(event);

    await waitFor(() =>
      expect(mocks.engine.mockPublish).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(mocks.navigation.mockedNavigate).toHaveBeenCalled(),
    );
  });

  it('foreground DELIVERED events increment badge count', async () => {
    const mocks = arrangeMocks();

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    expect(mocks.notifService.mockOnBackgroundEvent).toHaveBeenCalled();
    const callMockEvent =
      mocks.notifService.mockOnBackgroundEvent.mock.lastCall?.[0];
    if (!callMockEvent) {
      throw new Error('TEST FAILURE - failed to setup mockOnBackgroundEvent mock');
    }

    const event = {
      type: EventType.DELIVERED,
      detail: {
        notification: {
          data: {
            dataStr: JSON.stringify(createMockNotificationEthSent()),
          },
        },
      },
    } as unknown as NotifeeEvent;

    await callMockEvent(event);

    await waitFor(() =>
      expect(mocks.mockIncrementBadgeCount).toHaveBeenCalledWith(1),
    );
  });
});

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
    context: {
      NotificationServicesController: {
        state: { metamaskNotificationsList: [] },
        fetchAndUpdateMetamaskNotifications: jest.fn(),
      },
    },
  },
}));

const mockStoredNotification = createMockNotificationEthSent();

jest.mock('../constants', () => ({
  isNotificationsFeatureEnabled: jest.fn(),
}));

const arrangeEngineMocks = () => {
  const controller = Engine.context
    .NotificationServicesController as unknown as {
    state: { metamaskNotificationsList: unknown[] };
    fetchAndUpdateMetamaskNotifications: jest.Mock;
  };
  controller.state.metamaskNotificationsList = [mockStoredNotification];
  controller.fetchAndUpdateMetamaskNotifications.mockResolvedValue([]);
  return {
    mockPublish: jest.mocked(Engine.controllerMessenger.publish),
    controller,
  };
};

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

  it('navigates with the stored notification, not the clicked payload', async () => {
    const { notifService, navigation } = arrangeMocks();
    notifService.mockGetInitialNotification.mockResolvedValue({
      notification: {
        data: {
          dataStr: JSON.stringify({
            ...mockStoredNotification,
            data: { longDescription: '<a href="https://evil.test">x</a>' },
          }),
        },
      },
      pressAction: { id: PressActionId.OPEN_NOTIFICATIONS_VIEW },
    });

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    await waitFor(() =>
      expect(navigation.mockedNavigate).toHaveBeenCalledWith(
        expect.anything(),
        { notification: mockStoredNotification },
      ),
    );
  });

  it('does not navigate when the clicked notification id is not in controller state', async () => {
    const { notifService, engine, navigation } = arrangeMocks();
    const forged = {
      ...createMockNotificationEthSent(),
      id: 'forged-notification-id',
    };
    notifService.mockGetInitialNotification.mockResolvedValue({
      notification: { data: { dataStr: JSON.stringify(forged) } },
      pressAction: { id: PressActionId.OPEN_NOTIFICATIONS_VIEW },
    });

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    await waitFor(() =>
      expect(
        engine.controller.fetchAndUpdateMetamaskNotifications,
      ).toHaveBeenCalled(),
    );
    expect(engine.mockPublish).not.toHaveBeenCalled();
    expect(navigation.mockedNavigate).not.toHaveBeenCalled();
  });

  it('navigates when the clicked notification is found after refreshing notifications', async () => {
    const { engine, navigation } = arrangeMocks();
    engine.controller.state.metamaskNotificationsList = [];
    engine.controller.fetchAndUpdateMetamaskNotifications.mockImplementation(
      async () => {
        engine.controller.state.metamaskNotificationsList = [
          mockStoredNotification,
        ];
        return [];
      },
    );

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    await waitFor(() =>
      expect(navigation.mockedNavigate).toHaveBeenCalledWith(
        expect.anything(),
        { notification: mockStoredNotification },
      ),
    );
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

  it('does not navigate when the background click id is not in controller state', async () => {
    const mocks = arrangeMocks();

    renderHookWithProvider(() => useRegisterPushNotificationsEffect());

    await act(mocks, (e) => {
      if (e.detail.notification?.data) {
        e.detail.notification.data.dataStr = JSON.stringify({
          ...createMockNotificationEthSent(),
          id: 'forged-notification-id',
        });
      }
      return e;
    });

    await waitFor(() =>
      expect(
        mocks.engine.controller.fetchAndUpdateMetamaskNotifications,
      ).toHaveBeenCalled(),
    );
    expect(mocks.engine.mockPublish).not.toHaveBeenCalled();
    expect(mocks.navigation.mockedNavigate).not.toHaveBeenCalled();
  });
});

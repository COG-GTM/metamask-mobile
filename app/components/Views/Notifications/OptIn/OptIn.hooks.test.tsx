import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useHandleOptInCancel, useHandleOptInClick } from './OptIn.hooks';
import Routes from '../../../../constants/navigation/Routes';
import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import { IUseMetricsHook, MetaMetricsEvents } from '../../../hooks/useMetrics';
// eslint-disable-next-line import/no-namespace
import * as Selectors from '../../../../selectors/identity';

describe('useHandleOptInClick', () => {
  const arrange = (props = { basicFunctionalityEnabled: true }) => {
    // Mock Navigation
    const mockNavigate = jest.fn();
    const mockNavigation = {
      navigate: mockNavigate,
    } as unknown as NavigationProp<ParamListBase>;

    // Mock Metrics
    const mockTrackEvent = jest.fn();
    const mockCreateEventBuilder = jest.fn().mockReturnValue({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    });
    const mockMetrics = {
      trackEvent: mockTrackEvent,
      createEventBuilder: mockCreateEventBuilder,
    } as unknown as IUseMetricsHook;

    const mockEnableNotifications = jest.fn().mockImplementation(jest.fn());

    const mockSelectIsBackupAndSyncEnabled = jest.spyOn(
      Selectors,
      'selectIsBackupAndSyncEnabled',
    );

    const hook = renderHookWithProvider(
      () =>
        useHandleOptInClick({
          navigation: mockNavigation,
          metrics: mockMetrics,
          enableNotifications: mockEnableNotifications,
        }),
      {
        state: {
          settings: {
            basicFunctionalityEnabled: props.basicFunctionalityEnabled,
          },
        },
      },
    );

    return {
      hook,
      mockNavigate,
      mockTrackEvent,
      mockCreateEventBuilder,
      mockEnableNotifications,
      mockSelectIsBackupAndSyncEnabled,
    };
  };

  it('navigates to Basic Functionality if not enabled', async () => {
    const { hook, mockNavigate } = arrange({
      basicFunctionalityEnabled: false,
    });

    await hook.result.current();

    expect(mockNavigate).toHaveBeenCalledWith(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.BASIC_FUNCTIONALITY,
      params: {
        caller: Routes.NOTIFICATIONS.OPT_IN,
      },
    });
  });

  it('enables notifications and tracks event if Basic Functionality is enabled', async () => {
    const {
      hook,
      mockTrackEvent,
      mockCreateEventBuilder,
      mockEnableNotifications,
    } = arrange({ basicFunctionalityEnabled: true });

    await hook.result.current();

    expect(mockEnableNotifications).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      mockCreateEventBuilder(MetaMetricsEvents.NOTIFICATIONS_ACTIVATED)
        .addProperties({
          action_type: 'activated',
          is_profile_syncing_enabled: true,
        })
        .build(),
    );
  });
});

describe('useHandleOptInCancel', () => {
  const arrange = (props = { isCreatingNotifications: true }) => {
    // Mock Navigation
    const mockNavigate = jest.fn();
    const mockNavigation = {
      navigate: mockNavigate,
    } as unknown as NavigationProp<ParamListBase>;

    // Mock Metrics
    const mockTrackEvent = jest.fn();
    const mockCreateEventBuilder = jest.fn().mockReturnValue({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    });
    const mockMetrics = {
      trackEvent: mockTrackEvent,
      createEventBuilder: mockCreateEventBuilder,
    } as unknown as IUseMetricsHook;

    const mockSelectIsBackupAndSyncEnabled = jest.spyOn(
      Selectors,
      'selectIsBackupAndSyncEnabled',
    );

    const hook = renderHookWithProvider(() =>
      useHandleOptInCancel({
        navigation: mockNavigation,
        metrics: mockMetrics,
        isCreatingNotifications: props.isCreatingNotifications,
      }),
    );

    return {
      hook,
      mockNavigate,
      mockTrackEvent,
      mockCreateEventBuilder,
      mockSelectIsBackupAndSyncEnabled,
    };
  };

  it('tracks event and navigates to wallet view if not creating notifications', () => {
    const { hook, mockNavigate, mockTrackEvent, mockCreateEventBuilder } =
      arrange({ isCreatingNotifications: false });

    hook.result.current();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      mockCreateEventBuilder(MetaMetricsEvents.NOTIFICATIONS_ACTIVATED)
        .addProperties({
          action_type: 'dismissed',
          is_profile_syncing_enabled: true,
        })
        .build(),
    );
    expect(mockNavigate).toHaveBeenCalledWith(Routes.WALLET_VIEW);
  });

  it('only navigates to wallet view if creating notifications', () => {
    const { hook, mockNavigate, mockTrackEvent } = arrange({
      isCreatingNotifications: true,
    });

    hook.result.current();

    expect(mockTrackEvent).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(Routes.WALLET_VIEW);
  });
});

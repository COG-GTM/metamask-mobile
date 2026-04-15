import { renderHook, act } from '@testing-library/react-hooks';
import { useAlertsConfirmed } from './useAlertsConfirmed';
import { Severity } from '../Views/confirmations/types/alerts';

describe('useAlertsConfirmed', () => {
  const dangerAlertMock = {
    key: 'alert1',
    field: 'from',
    severity: Severity.Danger,
    message: 'Danger alert',
    title: 'Alert 1'
  };

  const warningAlertMock = {
    key: 'alert2',
    severity: Severity.Warning,
    message: 'Warning alert',
    title: 'Alert 2'
  };

  const infoAlertMock = {
    key: 'alert3',
    severity: Severity.Info,
    message: 'Info alert',
    title: 'Alert 3'
  };

  const blockerAlertMock = {
    key: 'alert4',
    severity: Severity.Danger,
    message: 'Blocker alert',
    title: 'Alert 4',
    isBlocking: true
  };

  const skipConfirmationAlertMock = {
    key: 'alert5',
    severity: Severity.Danger,
    message: 'Skip confirmation alert',
    title: 'Alert 5',
    skipConfirmation: true
  };

  const alertsMock = [dangerAlertMock, warningAlertMock, infoAlertMock];

  it('sets and gets alert confirmation status', () => {
    const { result } = renderHook(() => useAlertsConfirmed(alertsMock));

    act(() => {
      result.current.setAlertConfirmed(dangerAlertMock.key, true);
    });
    expect(result.current.isAlertConfirmed(dangerAlertMock.key)).toBe(true);

    act(() => {
      result.current.setAlertConfirmed(dangerAlertMock.key, false);
    });
    expect(result.current.isAlertConfirmed(dangerAlertMock.key)).toBe(false);
  });

  it('returns unconfirmed danger alerts', () => {
    const { result } = renderHook(() => useAlertsConfirmed(alertsMock));
    expect(result.current.unconfirmedDangerAlerts).toEqual([dangerAlertMock]);
    expect(result.current.hasUnconfirmedDangerAlerts).toBe(true);
  });

  it('returns unconfirmed field danger alerts', () => {
    const { result } = renderHook(() => useAlertsConfirmed(alertsMock));
    expect(result.current.unconfirmedFieldDangerAlerts).toEqual([dangerAlertMock]);
    expect(result.current.hasUnconfirmedFieldDangerAlerts).toBe(true);
  });

  it('returns hasBlockingAlerts true when there is a blocker alert', () => {
    const { result } = renderHook(() => useAlertsConfirmed([blockerAlertMock]));
    expect(result.current.hasBlockingAlerts).toBe(true);
  });

  it('returns hasUnconfirmedDangerAlerts false when there is a skip confirmation alert', () => {
    const { result } = renderHook(() => useAlertsConfirmed([skipConfirmationAlertMock]));
    expect(result.current.hasUnconfirmedDangerAlerts).toBe(false);
  });
});
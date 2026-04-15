import useConfirmationAlerts from './useConfirmationAlerts';
import useBlockaidAlerts from './useBlockaidAlerts';
import useDomainMismatchAlerts from './useDomainMismatchAlerts';
import { Severity } from '../../types/alerts';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import { siweSignatureConfirmationState } from '../../../../../util/test/confirm-data-helpers';
import { useInsufficientBalanceAlert } from './useInsufficientBalanceAlert';

jest.mock('./useBlockaidAlerts');
jest.mock('./useDomainMismatchAlerts');
jest.mock('./useInsufficientBalanceAlert');

describe('useConfirmationAlerts', () => {
  const ALERT_MESSAGE_MOCK = 'This is a test alert message.';
  const ALERT_DETAILS_MOCK = ['Detail 1', 'Detail 2'];
  const mockBlockaidAlerts = [
  {
    key: 'alert1',
    title: 'Test Alert',
    message: ALERT_MESSAGE_MOCK,
    severity: Severity.Warning,
    alertDetails: ALERT_DETAILS_MOCK
  }];

  const mockDomainMisMatchAlerts = [
  {
    key: 'domainMismatchAlert',
    title: 'Test Domain Mismatch Alert',
    message: ALERT_MESSAGE_MOCK,
    severity: Severity.Danger,
    alertDetails: ALERT_DETAILS_MOCK
  }];


  const mockInsufficientBalanceAlert = [
  {
    key: 'insufficientBalanceAlert',
    title: 'Test Insufficient Balance Alert',
    message: ALERT_MESSAGE_MOCK,
    severity: Severity.Danger,
    alertDetails: ALERT_DETAILS_MOCK
  }];


  beforeEach(() => {
    jest.clearAllMocks();
    useBlockaidAlerts.mockReturnValue([]);
    useDomainMismatchAlerts.mockReturnValue([]);
    useInsufficientBalanceAlert.mockReturnValue([]);
  });

  it('returns empty array if no alerts', () => {
    const { result } = renderHookWithProvider(() => useConfirmationAlerts());
    expect(result.current).toEqual([]);
  });

  it('returns blockaid alerts', () => {
    useBlockaidAlerts.mockReturnValue(mockBlockaidAlerts);
    const { result } = renderHookWithProvider(() => useConfirmationAlerts(), {
      state: siweSignatureConfirmationState
    });
    expect(result.current).toEqual(mockBlockaidAlerts);
  });

  it('returns domain mismatch alerts', () => {
    useDomainMismatchAlerts.mockReturnValue(mockDomainMisMatchAlerts);
    const { result } = renderHookWithProvider(() => useConfirmationAlerts(), {
      state: siweSignatureConfirmationState
    });
    expect(result.current).toEqual(mockDomainMisMatchAlerts);
  });

  it('returns combined alerts when both blockaid and domain mismatch alerts are present', () => {
    useBlockaidAlerts.mockReturnValue(mockBlockaidAlerts);
    useDomainMismatchAlerts.mockReturnValue(mockDomainMisMatchAlerts);
    useInsufficientBalanceAlert.mockReturnValue(mockInsufficientBalanceAlert);
    const { result } = renderHookWithProvider(() => useConfirmationAlerts(), {
      state: siweSignatureConfirmationState
    });
    expect(result.current).toEqual([
    ...mockBlockaidAlerts,
    ...mockDomainMisMatchAlerts,
    ...mockInsufficientBalanceAlert]
    );
  });
});
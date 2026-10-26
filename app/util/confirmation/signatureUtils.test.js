import { InteractionManager } from 'react-native';
import Engine from '../../core/Engine';
import NotificationManager from '../../core/NotificationManager';
import { MetaMetrics, MetaMetricsEvents } from '../../core/Analytics';
import { getBlockaidMetricsParams } from '../blockaid';
import { selectEvmChainId } from '../../selectors/networkController';
import Device from '../device';
import Logger from '../Logger';
import { strings } from '../../../locales/i18n';
import {
  addSignatureErrorListener,
  getAnalyticsParams,
  handleSignatureAction,
  removeSignatureErrorListener,
  shouldTruncateMessage,
  showWalletConnectNotification,
  typedSign,
  walletConnectNotificationTitle,
} from './signatureUtils';

const mockTrackEvent = jest.fn();

jest.mock('../../core/Engine', () => ({
  context: {
    SignatureController: {
      hub: { on: jest.fn(), removeListener: jest.fn() },
    },
  },
}));

jest.mock('../../core/Analytics', () => ({
  ...jest.requireActual('../../core/Analytics'),
  MetaMetrics: { getInstance: jest.fn() },
}));

jest.mock('../address', () => ({
  getAddressAccountType: jest.fn(() => 'MetaMask'),
}));

jest.mock('../blockaid', () => ({
  getBlockaidMetricsParams: jest.fn(),
}));

jest.mock('../../selectors/networkController', () => ({
  ...jest.requireActual('../../selectors/networkController'),
  selectEvmChainId: jest.fn(),
}));

jest.mock('../device', () => ({
  isIos: jest.fn(),
  isAndroid: jest.fn(),
}));

jest.mock('../Logger', () => ({
  error: jest.fn(),
}));

describe('signatureUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    selectEvmChainId.mockReturnValue('0x1');
    MetaMetrics.getInstance.mockReturnValue({ trackEvent: mockTrackEvent });
    InteractionManager.runAfterInteractions.mockImplementation((callback) =>
      callback(),
    );
  });

  it('exposes typed sign method names', () => {
    expect(typedSign).toEqual({
      V1: 'eth_signTypedData',
      V3: 'eth_signTypedData_v3',
      V4: 'eth_signTypedData_v4',
    });
  });

  describe('getAnalyticsParams', () => {
    it('throws for invalid message params', () => {
      expect(() => getAnalyticsParams(undefined, 'personal_sign')).toThrow(
        'Invalid messageParams provided',
      );
    });

    it('returns default analytics params', () => {
      expect(getAnalyticsParams({ from: '0x1' }, 'personal_sign')).toEqual({
        account_type: 'MetaMask',
        dapp_host_name: 'N/A',
        chain_id: '1',
        signature_type: 'personal_sign',
        version: 'N/A',
      });
    });

    it('includes page information and security alert params', () => {
      getBlockaidMetricsParams.mockReturnValue({ security_alert_reason: 'x' });
      const params = getAnalyticsParams(
        {
          from: '0x1',
          version: 'V4',
          currentPageInformation: { url: 'https://dapp.io/path' },
          meta: { analytics: { request_source: 'In-App-Browser' } },
        },
        typedSign.V4,
        { result_type: 'Malicious' },
      );
      expect(params).toEqual({
        account_type: 'MetaMask',
        dapp_host_name: 'dapp.io',
        chain_id: '1',
        signature_type: typedSign.V4,
        version: 'V4',
        request_source: 'In-App-Browser',
        security_alert_reason: 'x',
      });
    });

    it('logs errors while processing params', () => {
      const params = getAnalyticsParams(
        { from: '0x1', meta: { url: 'invalid url' } },
        'personal_sign',
      );
      expect(params.dapp_host_name).toBe('N/A');
      expect(Logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid URL' }),
        'Error processing analytics parameters:',
      );
    });
  });

  it.each([
    [true, false, 'notifications.wc_signed_title'],
    [false, false, 'notifications.wc_signed_rejected_title'],
    [true, true, 'notifications.wc_signed_failed_title'],
  ])(
    'walletConnectNotificationTitle(confirmation=%s, isError=%s)',
    (confirmation, isError, key) => {
      expect(walletConnectNotificationTitle(confirmation, isError)).toBe(
        strings(key),
      );
    },
  );

  describe('showWalletConnectNotification', () => {
    it.each([['wc::https://dapp.io'], ['MMSDKREMOTE::abc']])(
      'shows a notification for origin %s',
      (origin) => {
        showWalletConnectNotification({ origin }, true);
        expect(NotificationManager.showSimpleNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'simple_notification',
            duration: 5000,
            title: strings('notifications.wc_signed_title'),
          }),
        );
      },
    );

    it('uses rejected status when not confirmed', () => {
      showWalletConnectNotification({ origin: 'wc::dapp' });
      expect(NotificationManager.showSimpleNotification).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'simple_notification_rejected' }),
      );
    });

    it('does not show a notification for other origins', () => {
      showWalletConnectNotification({ origin: 'https://dapp.io' }, true);
      expect(NotificationManager.showSimpleNotification).not.toHaveBeenCalled();
    });
  });

  it.each([
    [true, MetaMetricsEvents.SIGNATURE_APPROVED],
    [false, MetaMetricsEvents.SIGNATURE_REJECTED],
  ])(
    'handleSignatureAction tracks confirmation=%s',
    async (confirmation, event) => {
      const onAction = jest.fn();
      await handleSignatureAction(
        onAction,
        { from: '0x1', origin: 'https://dapp.io' },
        'personal_sign',
        undefined,
        confirmation,
      );
      expect(onAction).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: event.category,
          properties: expect.objectContaining({
            signature_type: 'personal_sign',
          }),
        }),
      );
    },
  );

  it('adds and removes signature error listeners', () => {
    const listener = jest.fn();
    const { hub } = Engine.context.SignatureController;
    addSignatureErrorListener('id', listener);
    expect(hub.on).toHaveBeenCalledWith('id:signError', listener);
    removeSignatureErrorListener('id', listener);
    expect(hub.removeListener).toHaveBeenCalledWith('id:signError', listener);
  });

  describe('shouldTruncateMessage', () => {
    const event = (height) => ({ nativeEvent: { layout: { height } } });

    it('truncates tall messages on iOS', () => {
      Device.isIos.mockReturnValue(true);
      Device.isAndroid.mockReturnValue(false);
      expect(shouldTruncateMessage(event(71))).toBe(true);
      expect(shouldTruncateMessage(event(70))).toBe(false);
    });

    it('truncates tall messages on Android', () => {
      Device.isIos.mockReturnValue(false);
      Device.isAndroid.mockReturnValue(true);
      expect(shouldTruncateMessage(event(101))).toBe(true);
      expect(shouldTruncateMessage(event(100))).toBe(false);
    });
  });
});

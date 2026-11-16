import { InteractionManager } from 'react-native';
import { ResultType } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import { MetaMetrics, MetaMetricsEvents } from '../../core/Analytics';
import NotificationManager from '../../core/NotificationManager';
import Engine from '../../core/Engine';
import Logger from '../Logger';
import { strings } from '../../../locales/i18n';
import { WALLET_CONNECT_ORIGIN } from '../walletconnect';
import AppConstants from '../../core/AppConstants';
import {
  addSignatureErrorListener,
  getAnalyticsParams,
  handleSignatureAction,
  removeSignatureErrorListener,
  showWalletConnectNotification,
  typedSign,
} from './signatureUtils';

jest.mock('../../core/Analytics/MetaMetrics');

jest.mock('../../core/Engine', () => ({
  context: {
    SignatureController: {
      hub: {
        on: jest.fn(),
        removeListener: jest.fn(),
      },
    },
  },
}));

jest.mock('../../core/NotificationManager', () => ({
  showSimpleNotification: jest.fn(),
}));

jest.mock('../../store', () => ({
  store: { getState: jest.fn().mockReturnValue({}) },
}));

jest.mock('../../selectors/networkController', () => ({
  ...jest.requireActual('../../selectors/networkController'),
  selectEvmChainId: jest.fn(() => '0x1'),
}));

jest.mock('../address', () => ({
  ...jest.requireActual('../address'),
  getAddressAccountType: jest.fn().mockReturnValue('Metamask'),
}));

jest.mock('../Logger', () => ({
  error: jest.fn(),
}));

const mockTrackEvent = jest.fn();

const messageParams = {
  data: 'message',
  from: '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272',
  origin: 'example.com',
  metamaskId: 'id',
  version: 'V4',
  meta: { url: 'https://example.com/path', title: 'Example' },
};

const securityAlertResponse = {
  result_type: ResultType.Benign,
  reason: '',
  source: 'api',
  description: '',
  features: [],
  providerRequestsCount: { eth_chainId: 1 },
};

const expectedProperties = {
  account_type: 'Metamask',
  dapp_host_name: 'example.com',
  chain_id: '1',
  signature_type: typedSign.V4,
  version: 'V4',
  security_alert_response: ResultType.Benign,
  security_alert_reason: '',
  security_alert_source: 'api',
  ppom_eth_chainId_count: 1,
};

describe('signatureUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (MetaMetrics.getInstance as jest.Mock).mockReturnValue({
      trackEvent: mockTrackEvent,
    });
    jest
      .spyOn(InteractionManager, 'runAfterInteractions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((callback: any) => callback());
  });

  describe('handleSignatureAction', () => {
    it('calls onAction then tracks SIGNATURE_APPROVED with analytics params when confirmation is true', async () => {
      const onAction = jest.fn().mockResolvedValue(undefined);

      await handleSignatureAction(
        onAction,
        messageParams,
        typedSign.V4,
        securityAlertResponse,
        true,
      );

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(onAction.mock.invocationCallOrder[0]).toBeLessThan(
        mockTrackEvent.mock.invocationCallOrder[0],
      );
      const [event] = mockTrackEvent.mock.calls[0];
      expect(event.name).toBe(MetaMetricsEvents.SIGNATURE_APPROVED.category);
      expect(event.name).toBe('Signature Approved');
      expect(event.properties).toStrictEqual(expectedProperties);
    });

    it('calls onAction then tracks SIGNATURE_REJECTED with analytics params when confirmation is false', async () => {
      const onAction = jest.fn().mockResolvedValue(undefined);

      await handleSignatureAction(
        onAction,
        messageParams,
        typedSign.V4,
        securityAlertResponse,
        false,
      );

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      const [event] = mockTrackEvent.mock.calls[0];
      expect(event.name).toBe(MetaMetricsEvents.SIGNATURE_REJECTED.category);
      expect(event.name).toBe('Signature Rejected');
      expect(event.properties).toStrictEqual(expectedProperties);
    });

    it('includes malicious security alert properties', async () => {
      await handleSignatureAction(
        jest.fn(),
        messageParams,
        typedSign.V4,
        {
          ...securityAlertResponse,
          result_type: ResultType.Malicious,
          reason: 'transfer_farming',
        },
        false,
      );

      const [event] = mockTrackEvent.mock.calls[0];
      expect(event.name).toBe('Signature Rejected');
      expect(event.properties).toStrictEqual({
        ...expectedProperties,
        security_alert_response: ResultType.Malicious,
        security_alert_reason: 'transfer_farming',
        ui_customizations: ['flagged_as_malicious'],
      });
    });

    it('omits security alert properties when there is no security alert response', async () => {
      await handleSignatureAction(
        jest.fn(),
        messageParams,
        typedSign.V4,
        undefined,
        true,
      );

      const [event] = mockTrackEvent.mock.calls[0];
      expect(event.properties).toStrictEqual({
        account_type: 'Metamask',
        dapp_host_name: 'example.com',
        chain_id: '1',
        signature_type: typedSign.V4,
        version: 'V4',
      });
    });

    it('does not track or notify when onAction throws', async () => {
      const onAction = jest.fn().mockRejectedValue(new Error('failed'));

      await expect(
        handleSignatureAction(
          onAction,
          { ...messageParams, origin: WALLET_CONNECT_ORIGIN },
          typedSign.V4,
          securityAlertResponse,
          true,
        ),
      ).rejects.toThrow('failed');

      expect(mockTrackEvent).not.toHaveBeenCalled();
      expect(NotificationManager.showSimpleNotification).not.toHaveBeenCalled();
    });

    it.each([
      [true, 'simple_notification', 'notifications.wc_signed_title'],
      [
        false,
        'simple_notification_rejected',
        'notifications.wc_signed_rejected_title',
      ],
    ])(
      'shows a WalletConnect notification matching confirmation=%s',
      async (confirmation, status, titleKey) => {
        await handleSignatureAction(
          jest.fn(),
          { ...messageParams, origin: WALLET_CONNECT_ORIGIN },
          typedSign.V4,
          securityAlertResponse,
          confirmation,
        );

        expect(NotificationManager.showSimpleNotification).toHaveBeenCalledWith(
          {
            status,
            duration: 5000,
            title: strings(titleKey),
            description: strings('notifications.wc_description'),
          },
        );
      },
    );
  });

  describe('showWalletConnectNotification', () => {
    it('shows a notification for SDK remote origins', () => {
      showWalletConnectNotification(
        { origin: AppConstants.MM_SDK.SDK_REMOTE_ORIGIN },
        true,
      );

      expect(NotificationManager.showSimpleNotification).toHaveBeenCalledTimes(
        1,
      );
    });

    it('shows the failure title when isError is true', () => {
      showWalletConnectNotification(
        { origin: WALLET_CONNECT_ORIGIN },
        false,
        true,
      );

      expect(NotificationManager.showSimpleNotification).toHaveBeenCalledWith({
        status: 'simple_notification_rejected',
        duration: 5000,
        title: strings('notifications.wc_signed_failed_title'),
        description: strings('notifications.wc_description'),
      });
    });

    it('does not show a notification for other origins', () => {
      showWalletConnectNotification({ origin: 'example.com' }, true);

      expect(NotificationManager.showSimpleNotification).not.toHaveBeenCalled();
    });
  });

  describe('getAnalyticsParams', () => {
    it('throws for invalid messageParams', () => {
      expect(() => getAnalyticsParams(undefined, typedSign.V4)).toThrow(
        'Invalid messageParams provided',
      );
    });

    it('uses currentPageInformation url and analytics overrides', () => {
      expect(
        getAnalyticsParams(
          {
            from: messageParams.from,
            currentPageInformation: {
              url: 'http://localhost:8545',
              analytics: { request_source: 'In-App-Browser' },
            },
          },
          'personal_sign',
          undefined,
        ),
      ).toStrictEqual({
        account_type: 'Metamask',
        dapp_host_name: 'localhost:8545',
        chain_id: '1',
        signature_type: 'personal_sign',
        version: 'N/A',
        request_source: 'In-App-Browser',
      });
    });

    it('logs and keeps defaults when the url is invalid', () => {
      expect(
        getAnalyticsParams(
          { from: messageParams.from, meta: { url: 'not a url' } },
          typedSign.V1,
          securityAlertResponse,
        ),
      ).toStrictEqual({
        account_type: 'Metamask',
        dapp_host_name: 'N/A',
        chain_id: '1',
        signature_type: typedSign.V1,
        version: 'N/A',
      });
      expect(Logger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('signature error listeners', () => {
    it('adds and removes the signError listener for the metamaskId', () => {
      const listener = jest.fn();

      addSignatureErrorListener('id', listener);
      removeSignatureErrorListener('id', listener);

      expect(Engine.context.SignatureController.hub.on).toHaveBeenCalledWith(
        'id:signError',
        listener,
      );
      expect(
        Engine.context.SignatureController.hub.removeListener,
      ).toHaveBeenCalledWith('id:signError', listener);
    });
  });
});

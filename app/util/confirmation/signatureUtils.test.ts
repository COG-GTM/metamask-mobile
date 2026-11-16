import { InteractionManager } from 'react-native';
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
import Engine from '../../core/Engine';
import NotificationManager from '../../core/NotificationManager';
import { MetaMetricsEvents } from '../../core/Analytics';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';
import { selectEvmChainId } from '../../selectors/networkController';
import { getAddressAccountType } from '../address';
import Logger from '../Logger';
import Device from '../device';
import { WALLET_CONNECT_ORIGIN } from '../walletconnect';
import AppConstants from '../../core/AppConstants';
import { strings } from '../../../locales/i18n';

const mockTrackEvent = jest.fn();

jest.mock('../../core/Analytics/MetaMetrics', () => ({
  getInstance: () => ({ trackEvent: mockTrackEvent }),
}));

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
  store: { getState: jest.fn(() => ({})) },
}));

jest.mock('../../selectors/networkController', () => ({
  selectEvmChainId: jest.fn(),
}));

jest.mock('../address', () => ({
  getAddressAccountType: jest.fn(),
}));

jest.mock('../Logger', () => ({
  error: jest.fn(),
}));

jest.mock('../device', () => ({
  isIos: jest.fn(),
  isAndroid: jest.fn(),
}));

const mockSelectEvmChainId = selectEvmChainId as unknown as jest.Mock;
const mockGetAddressAccountType = getAddressAccountType as jest.Mock;
const mockShowSimpleNotification =
  NotificationManager.showSimpleNotification as jest.Mock;

const FROM = '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272';

const securityAlertResponse = {
  result_type: 'Malicious',
  reason: 'raw_native_token_transfer',
  source: 'api',
  description: '',
  features: [],
  providerRequestsCount: { eth_chainId: 1, eth_getCode: 2 },
};

describe('signatureUtils', () => {
  let runAfterInteractionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectEvmChainId.mockReturnValue('0x89');
    mockGetAddressAccountType.mockReturnValue('MetaMask');
    runAfterInteractionsSpy = jest
      .spyOn(InteractionManager, 'runAfterInteractions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((task?: any) => {
        task?.();
        return {
          then: jest.fn(),
          done: jest.fn(),
          cancel: jest.fn(),
        } as unknown as ReturnType<
          typeof InteractionManager.runAfterInteractions
        >;
      });
  });

  afterEach(() => {
    runAfterInteractionsSpy.mockRestore();
  });

  describe('getAnalyticsParams', () => {
    it.each([null, undefined, 'string', 42])(
      'throws when messageParams is %p',
      (messageParams) => {
        expect(() =>
          getAnalyticsParams(messageParams, typedSign.V4, undefined),
        ).toThrow('Invalid messageParams provided');
      },
    );

    it('returns defaults when no page info, version or security response is present', () => {
      const params = getAnalyticsParams(
        { from: FROM },
        typedSign.V4,
        undefined,
      );

      expect(mockGetAddressAccountType).toHaveBeenCalledWith(FROM);
      expect(params).toEqual({
        account_type: 'MetaMask',
        dapp_host_name: 'N/A',
        chain_id: '137',
        signature_type: 'eth_signTypedData_v4',
        version: 'N/A',
      });
    });

    it('converts the selected EVM chain ID to decimal', () => {
      mockSelectEvmChainId.mockReturnValue('0x1');
      expect(
        getAnalyticsParams({ from: FROM }, 'personal_sign', undefined).chain_id,
      ).toBe('1');

      mockSelectEvmChainId.mockReturnValue('0xaa36a7');
      expect(
        getAnalyticsParams({ from: FROM }, 'personal_sign', undefined).chain_id,
      ).toBe('11155111');
    });

    it('extracts the dapp host (with port) from currentPageInformation.url', () => {
      const params = getAnalyticsParams(
        {
          from: FROM,
          version: 'V3',
          currentPageInformation: {
            url: 'https://app.uniswap.org:8443/swap?x=1#y',
          },
        },
        typedSign.V3,
        undefined,
      );

      expect(params.dapp_host_name).toBe('app.uniswap.org:8443');
      expect(params.version).toBe('V3');
      expect(params.signature_type).toBe('eth_signTypedData_v3');
    });

    it('prefers meta.url over currentPageInformation.url', () => {
      const params = getAnalyticsParams(
        {
          from: FROM,
          currentPageInformation: { url: 'https://page.example' },
          meta: { url: 'https://meta.example' },
        },
        typedSign.V4,
        undefined,
      );

      expect(params.dapp_host_name).toBe('meta.example');
    });

    it('spreads pageInfo.analytics into the payload', () => {
      const params = getAnalyticsParams(
        {
          from: FROM,
          meta: { analytics: { request_source: 'WalletConnect', foo: 'bar' } },
        },
        typedSign.V4,
        undefined,
      );

      expect(params).toMatchObject({
        request_source: 'WalletConnect',
        foo: 'bar',
      });
    });

    it('merges Blockaid params from the security alert response', () => {
      const params = getAnalyticsParams(
        { from: FROM, currentPageInformation: { url: 'https://dapp.io' } },
        typedSign.V4,
        securityAlertResponse,
      );

      expect(params).toEqual({
        account_type: 'MetaMask',
        dapp_host_name: 'dapp.io',
        chain_id: '137',
        signature_type: 'eth_signTypedData_v4',
        version: 'N/A',
        security_alert_response: 'Malicious',
        security_alert_reason: 'raw_native_token_transfer',
        security_alert_source: 'api',
        ui_customizations: ['flagged_as_malicious'],
        ppom_eth_chainId_count: 1,
        ppom_eth_getCode_count: 2,
      });
    });

    it('logs and keeps defaults when the url is invalid, without throwing', () => {
      let params: ReturnType<typeof getAnalyticsParams> | undefined;
      expect(() => {
        params = getAnalyticsParams(
          { from: FROM, currentPageInformation: { url: 'not a url' } },
          typedSign.V4,
          securityAlertResponse,
        );
      }).not.toThrow();

      expect(params?.dapp_host_name).toBe('N/A');
      expect(params?.chain_id).toBe('137');
      // Blockaid merge runs after URL parsing inside the same try block
      expect(params?.security_alert_response).toBeUndefined();
      expect(Logger.error).toHaveBeenCalledTimes(1);
      expect(Logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'TypeError' }),
        'Error processing analytics parameters:',
      );
    });

    it('logs and keeps chain_id null when reading the chain ID fails', () => {
      mockSelectEvmChainId.mockImplementation(() => {
        throw new Error('no provider config');
      });

      const params = getAnalyticsParams(
        { from: FROM, currentPageInformation: { url: 'https://dapp.io' } },
        typedSign.V4,
        undefined,
      );

      expect(params.chain_id).toBeNull();
      expect(params.dapp_host_name).toBe('N/A');
      expect(Logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'no provider config' }),
        'Error processing analytics parameters:',
      );
    });
  });

  describe('walletConnectNotificationTitle', () => {
    it('returns the failed title when isError is true', () => {
      expect(walletConnectNotificationTitle(true, true)).toBe(
        strings('notifications.wc_signed_failed_title'),
      );
    });

    it('returns signed / rejected titles based on confirmation', () => {
      expect(walletConnectNotificationTitle(true, false)).toBe(
        strings('notifications.wc_signed_title'),
      );
      expect(walletConnectNotificationTitle(false, false)).toBe(
        strings('notifications.wc_signed_rejected_title'),
      );
    });
  });

  describe('showWalletConnectNotification', () => {
    it.each([
      ['WalletConnect', `${WALLET_CONNECT_ORIGIN}https://dapp.io`],
      ['WalletConnect (upper case)', `WC::HTTPS://DAPP.IO`],
      ['WalletConnect (colons stripped)', 'wchttps//dapp.io'],
      ['SDK', `${AppConstants.MM_SDK.SDK_REMOTE_ORIGIN}dapp.io`],
      ['SDK (lower case)', 'mmsdkremote::dapp.io'],
    ])('shows a confirmed notification for %s origin', (_label, origin) => {
      showWalletConnectNotification({ origin }, true);

      expect(runAfterInteractionsSpy).toHaveBeenCalledTimes(1);
      expect(mockShowSimpleNotification).toHaveBeenCalledWith({
        status: 'simple_notification',
        duration: 5000,
        title: strings('notifications.wc_signed_title'),
        description: strings('notifications.wc_description'),
      });
    });

    it('shows a rejected notification when confirmation is false', () => {
      showWalletConnectNotification(
        { origin: `${WALLET_CONNECT_ORIGIN}dapp.io` },
        false,
      );

      expect(mockShowSimpleNotification).toHaveBeenCalledWith({
        status: 'simple_notification_rejected',
        duration: 5000,
        title: strings('notifications.wc_signed_rejected_title'),
        description: strings('notifications.wc_description'),
      });
    });

    it('shows a failed notification when isError is true', () => {
      showWalletConnectNotification(
        { origin: `${AppConstants.MM_SDK.SDK_REMOTE_ORIGIN}dapp.io` },
        false,
        true,
      );

      expect(mockShowSimpleNotification).toHaveBeenCalledWith({
        status: 'simple_notification_rejected',
        duration: 5000,
        title: strings('notifications.wc_signed_failed_title'),
        description: strings('notifications.wc_description'),
      });
    });

    it.each([
      'https://dapp.io',
      'example.com',
      'metamask',
      'dapp.io/wc::',
      'https://mmsdkremote.evil.io',
    ])('does not notify for in-app origin %p', (origin) => {
      showWalletConnectNotification({ origin }, true);

      expect(runAfterInteractionsSpy).toHaveBeenCalledTimes(1);
      expect(mockShowSimpleNotification).not.toHaveBeenCalled();
    });

    it('defers the origin check until interactions finish', () => {
      runAfterInteractionsSpy.mockImplementation(
        () =>
          ({} as ReturnType<typeof InteractionManager.runAfterInteractions>),
      );

      showWalletConnectNotification(
        { origin: `${WALLET_CONNECT_ORIGIN}dapp.io` },
        true,
      );

      expect(mockShowSimpleNotification).not.toHaveBeenCalled();
    });
  });

  describe('handleSignatureAction', () => {
    const messageParams = {
      from: FROM,
      origin: 'https://dapp.io',
      version: 'V4',
      currentPageInformation: { url: 'https://dapp.io/sign' },
    };

    it('does not notify or track until the action has completed', async () => {
      let resolveAction: () => void = () => undefined;
      const onAction = jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAction = resolve;
          }),
      );

      const pending = handleSignatureAction(
        onAction,
        { ...messageParams, origin: `${WALLET_CONNECT_ORIGIN}dapp.io` },
        typedSign.V4,
        securityAlertResponse,
        true,
      );
      await Promise.resolve();

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).not.toHaveBeenCalled();
      expect(mockShowSimpleNotification).not.toHaveBeenCalled();

      resolveAction();
      await pending;

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockShowSimpleNotification).toHaveBeenCalledTimes(1);
    });

    it.each([
      [true, MetaMetricsEvents.SIGNATURE_APPROVED],
      [false, MetaMetricsEvents.SIGNATURE_REJECTED],
    ])(
      'confirmation=%p awaits the action and tracks %o with analytics params',
      async (confirmation, event) => {
        const calls: string[] = [];
        const onAction = jest.fn(async () => {
          calls.push('action');
        });
        mockTrackEvent.mockImplementation(() => calls.push('track'));

        await handleSignatureAction(
          onAction,
          messageParams,
          typedSign.V4,
          securityAlertResponse,
          confirmation,
        );

        expect(onAction).toHaveBeenCalledTimes(1);
        expect(calls).toEqual(['action', 'track']);
        expect(mockTrackEvent).toHaveBeenCalledTimes(1);
        expect(mockTrackEvent).toHaveBeenCalledWith(
          MetricsEventBuilder.createEventBuilder(event)
            .addProperties(
              getAnalyticsParams(
                messageParams,
                typedSign.V4,
                securityAlertResponse,
              ),
            )
            .build(),
        );
        const tracked = mockTrackEvent.mock.calls[0][0];
        expect(tracked.name).toBe(event.category);
        expect(tracked.properties).toMatchObject({
          dapp_host_name: 'dapp.io',
          chain_id: '137',
          signature_type: 'eth_signTypedData_v4',
          version: 'V4',
          security_alert_response: 'Malicious',
        });
      },
    );

    it('shows the WalletConnect notification for WC requests', async () => {
      await handleSignatureAction(
        jest.fn(),
        { ...messageParams, origin: `${WALLET_CONNECT_ORIGIN}dapp.io` },
        typedSign.V4,
        undefined,
        true,
      );

      expect(mockShowSimpleNotification).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'simple_notification' }),
      );
    });

    it('does not track or notify when the action rejects', async () => {
      const onAction = jest.fn().mockRejectedValue(new Error('failed'));

      await expect(
        handleSignatureAction(
          onAction,
          { ...messageParams, origin: `${WALLET_CONNECT_ORIGIN}dapp.io` },
          typedSign.V4,
          undefined,
          true,
        ),
      ).rejects.toThrow('failed');

      expect(mockTrackEvent).not.toHaveBeenCalled();
      expect(mockShowSimpleNotification).not.toHaveBeenCalled();
    });

    it('still tracks the event when the page url is malformed', async () => {
      await handleSignatureAction(
        jest.fn(),
        { ...messageParams, currentPageInformation: { url: '::bad' } },
        typedSign.V4,
        undefined,
        false,
      );

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent.mock.calls[0][0].properties.dapp_host_name).toBe(
        'N/A',
      );
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('signature error listeners', () => {
    it('subscribes and unsubscribes on the SignatureController hub', () => {
      const handler = jest.fn();

      addSignatureErrorListener('id-1', handler);
      removeSignatureErrorListener('id-1', handler);

      expect(Engine.context.SignatureController.hub.on).toHaveBeenCalledWith(
        'id-1:signError',
        handler,
      );
      expect(
        Engine.context.SignatureController.hub.removeListener,
      ).toHaveBeenCalledWith('id-1:signError', handler);
    });
  });

  describe('shouldTruncateMessage', () => {
    const layout = (height: number) => ({
      nativeEvent: { layout: { height } },
    });

    it('truncates on iOS above 70px', () => {
      (Device.isIos as jest.Mock).mockReturnValue(true);
      (Device.isAndroid as jest.Mock).mockReturnValue(false);
      expect(shouldTruncateMessage(layout(71))).toBe(true);
      expect(shouldTruncateMessage(layout(70))).toBe(false);
    });

    it('truncates on Android above 100px', () => {
      (Device.isIos as jest.Mock).mockReturnValue(false);
      (Device.isAndroid as jest.Mock).mockReturnValue(true);
      expect(shouldTruncateMessage(layout(101))).toBe(true);
      expect(shouldTruncateMessage(layout(100))).toBe(false);
    });
  });
});

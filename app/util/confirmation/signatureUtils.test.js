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
import NotificationManager from '../../core/NotificationManager';
import Engine from '../../core/Engine';
import Device from '../device';

jest.mock('../../../locales/i18n', () => ({
  strings: (k) => k,
}));

jest.mock('../../core/NotificationManager', () => ({
  showSimpleNotification: jest.fn(),
}));

jest.mock('../../core/Analytics', () => ({
  MetaMetrics: {
    getInstance: jest.fn(() => ({ trackEvent: jest.fn() })),
  },
  MetaMetricsEvents: {
    SIGNATURE_APPROVED: 'SIGNATURE_APPROVED',
    SIGNATURE_REJECTED: 'SIGNATURE_REJECTED',
  },
}));

jest.mock('../../core/Analytics/MetricsEventBuilder', () => ({
  MetricsEventBuilder: {
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(() => ({})),
    })),
  },
}));

jest.mock('../address', () => ({
  getAddressAccountType: jest.fn(() => 'MetaMask'),
}));

jest.mock('../blockaid', () => ({
  getBlockaidMetricsParams: jest.fn(() => ({ blockaid: true })),
}));

jest.mock('../device', () => ({
  __esModule: true,
  default: {
    isIos: jest.fn(() => false),
    isAndroid: jest.fn(() => false),
  },
}));

beforeEach(() => {
  jest
    .spyOn(InteractionManager, 'runAfterInteractions')
    .mockImplementation((cb) => {
      if (typeof cb === 'function') cb();
      return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() };
    });
});

describe('typedSign', () => {
  it('exposes the V1/V3/V4 method names', () => {
    expect(typedSign).toEqual({
      V1: 'eth_signTypedData',
      V3: 'eth_signTypedData_v3',
      V4: 'eth_signTypedData_v4',
    });
  });
});

describe('getAnalyticsParams', () => {
  it('throws when messageParams is invalid', () => {
    expect(() => getAnalyticsParams(undefined, 'V1')).toThrow(
      'Invalid messageParams provided',
    );
  });

  it('includes dapp host and signature_type for valid messageParams', () => {
    const params = getAnalyticsParams(
      { from: '0x1', currentPageInformation: { url: 'https://dapp.io/app' } },
      'V3',
    );
    expect(params.signature_type).toBe('V3');
    expect(params.dapp_host_name).toBe('dapp.io');
  });

  it('merges blockaid metrics when provided', () => {
    const params = getAnalyticsParams(
      { from: '0x1' },
      'V4',
      { result_type: 'Malicious' },
    );
    expect(params.blockaid).toBe(true);
  });
});

describe('walletConnectNotificationTitle', () => {
  it('returns an error title when isError is true', () => {
    expect(walletConnectNotificationTitle(false, true)).toBe(
      'notifications.wc_signed_failed_title',
    );
  });

  it('returns confirmation / rejection titles based on the flag', () => {
    expect(walletConnectNotificationTitle(true, false)).toBe(
      'notifications.wc_signed_title',
    );
    expect(walletConnectNotificationTitle(false, false)).toBe(
      'notifications.wc_signed_rejected_title',
    );
  });
});

describe('showWalletConnectNotification', () => {
  beforeEach(() => {
    NotificationManager.showSimpleNotification.mockClear();
  });

  it('only fires the notification for WalletConnect / SDK origins', () => {
    showWalletConnectNotification({ origin: 'https://dapp.io' }, true);
    expect(NotificationManager.showSimpleNotification).not.toHaveBeenCalled();

    showWalletConnectNotification({ origin: 'wc::aabb' }, true);
    expect(NotificationManager.showSimpleNotification).toHaveBeenCalledTimes(1);
  });
});

describe('handleSignatureAction', () => {
  it('invokes the provided action and shows the WC notification', async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);
    await handleSignatureAction(
      onAction,
      { from: '0x1', origin: 'wc::abc' },
      'V4',
      undefined,
      true,
    );
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('add/removeSignatureErrorListener', () => {
  it('delegates to Engine.SignatureController.hub', () => {
    const on = jest.fn();
    const removeListener = jest.fn();
    Engine.context.SignatureController = { hub: { on, removeListener } };

    const handler = jest.fn();
    addSignatureErrorListener('id1', handler);
    expect(on).toHaveBeenCalledWith('id1:signError', handler);

    removeSignatureErrorListener('id1', handler);
    expect(removeListener).toHaveBeenCalledWith('id1:signError', handler);
  });
});

describe('shouldTruncateMessage', () => {
  it('truncates tall messages on iOS', () => {
    Device.isIos.mockReturnValue(true);
    Device.isAndroid.mockReturnValue(false);
    expect(
      shouldTruncateMessage({ nativeEvent: { layout: { height: 200 } } }),
    ).toBe(true);
    expect(
      shouldTruncateMessage({ nativeEvent: { layout: { height: 10 } } }),
    ).toBe(false);
  });

  it('uses a larger threshold on Android', () => {
    Device.isIos.mockReturnValue(false);
    Device.isAndroid.mockReturnValue(true);
    expect(
      shouldTruncateMessage({ nativeEvent: { layout: { height: 101 } } }),
    ).toBe(true);
    expect(
      shouldTruncateMessage({ nativeEvent: { layout: { height: 80 } } }),
    ).toBe(false);
  });
});

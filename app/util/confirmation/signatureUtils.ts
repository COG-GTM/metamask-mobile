import { LayoutChangeEvent } from 'react-native';
import Engine from '../../core/Engine';
import { MetaMetrics, MetaMetricsEvents } from '../../core/Analytics';
import { getAddressAccountType } from '../address';
import NotificationManager from '../../core/NotificationManager';
import { WALLET_CONNECT_ORIGIN } from '../walletconnect';
import AppConstants from '../../core/AppConstants';
import { InteractionManager } from 'react-native';
import { strings } from '../../../locales/i18n';
import { selectEvmChainId } from '../../selectors/networkController';
import { store } from '../../store';
import { getBlockaidMetricsParams } from '../blockaid';
import type { SecurityAlertResponse as ControllerSecurityAlertResponse } from '@metamask/transaction-controller';
import Device from '../device';
import { getDecimalChainId } from '../networks';
import Logger from '../Logger';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';

export const typedSign = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
} as const;

export interface PageInformation {
  url?: string;
  analytics?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MessageParams {
  from?: string;
  origin?: string;
  version?: string;
  currentPageInformation?: PageInformation;
  meta?: PageInformation;
  [key: string]: unknown;
}

export interface SecurityAlertResponse {
  [key: string]: unknown;
}

export interface AnalyticsParams {
  account_type: string;
  dapp_host_name: string;
  chain_id: string | null;
  signature_type: string;
  version: string;
  [key: string]: unknown;
}

export const getAnalyticsParams = (
  messageParams: MessageParams,
  signType: string,
  securityAlertResponse?: SecurityAlertResponse,
): AnalyticsParams => {
  // The local SecurityAlertResponse shape is broader than the controller's;
  // cast at the boundary where needed.
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const { currentPageInformation = {}, meta = {} } = messageParams;
  const pageInfo: PageInformation = { ...currentPageInformation, ...meta };

  const analyticsParams: AnalyticsParams = {
    account_type: getAddressAccountType(messageParams.from ?? ''),
    dapp_host_name: 'N/A',
    chain_id: null,
    signature_type: signType,
    version: messageParams?.version || 'N/A',
    ...(pageInfo.analytics as Record<string, unknown>),
  };

  try {
    const chainId = selectEvmChainId(store.getState());
    analyticsParams.chain_id = getDecimalChainId(chainId);

    if (pageInfo.url) {
      const url = new URL(pageInfo.url);
      analyticsParams.dapp_host_name = url.host;
    }

    if (securityAlertResponse) {
      const blockaidParams = getBlockaidMetricsParams(
        securityAlertResponse as unknown as ControllerSecurityAlertResponse,
      );
      Object.assign(analyticsParams, blockaidParams);
    }
  } catch (error) {
    Logger.error(error as Error, 'Error processing analytics parameters:');
  }

  return analyticsParams;
};

export const walletConnectNotificationTitle = (
  confirmation: boolean,
  isError: boolean,
): string => {
  if (isError) return strings('notifications.wc_signed_failed_title');
  return confirmation
    ? strings('notifications.wc_signed_title')
    : strings('notifications.wc_signed_rejected_title');
};

export const showWalletConnectNotification = (
  messageParams: MessageParams = {},
  confirmation: boolean = false,
  isError: boolean = false,
): void => {
  InteractionManager.runAfterInteractions(() => {
    /**
     * FIXME: need to rewrite the way BackgroundBridge sets the origin.
     */
    const stripColon = (value: string): string => value.split(':').join('');
    const origin = stripColon((messageParams.origin ?? '').toLowerCase());
    const isWCOrigin = origin.startsWith(
      stripColon(WALLET_CONNECT_ORIGIN).toLowerCase(),
    );
    const isSDKOrigin = origin.startsWith(
      stripColon(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN).toLowerCase(),
    );

    if (isWCOrigin || isSDKOrigin) {
      NotificationManager.showSimpleNotification({
        status: `simple_notification${!confirmation ? '_rejected' : ''}`,
        duration: 5000,
        title: walletConnectNotificationTitle(confirmation, isError),
        description: strings('notifications.wc_description'),
      });
    }
  });
};

// `securityAlertResponse` is intentionally widened to `unknown` to preserve
// compatibility with pre-existing callers (e.g. `hardwareWallet/signatureUtils`)
// that historically passed a boolean here in the original untyped JavaScript.
export const handleSignatureAction = async (
  onAction: () => Promise<void> | void,
  messageParams: MessageParams,
  signType: string,
  securityAlertResponse?: unknown,
  confirmation: boolean = false,
): Promise<void> => {
  await onAction();
  showWalletConnectNotification(messageParams, confirmation);
  MetaMetrics.getInstance().trackEvent(
    MetricsEventBuilder.createEventBuilder(
      confirmation
        ? MetaMetricsEvents.SIGNATURE_APPROVED
        : MetaMetricsEvents.SIGNATURE_REJECTED,
    )
      .addProperties(
        getAnalyticsParams(
          messageParams,
          signType,
          securityAlertResponse as SecurityAlertResponse | undefined,
        ) as unknown as Record<string, never>,
      )
      .build(),
  );
};

export type SignatureErrorListener = (...args: unknown[]) => void;

export const addSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: SignatureErrorListener,
): void => {
  Engine.context.SignatureController.hub.on(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const removeSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: SignatureErrorListener,
): void => {
  Engine.context.SignatureController.hub.removeListener(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const shouldTruncateMessage = (e: LayoutChangeEvent): boolean => {
  if (
    (Device.isIos() && e.nativeEvent.layout.height > 70) ||
    (Device.isAndroid() && e.nativeEvent.layout.height > 100)
  ) {
    return true;
  }

  return false;
};

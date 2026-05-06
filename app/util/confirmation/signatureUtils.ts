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
import Device from '../device';
import { getDecimalChainId } from '../networks';
import Logger from '../Logger';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';

export const typedSign = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
} as const;

export interface MessageParams {
  from?: string;
  origin?: string;
  version?: string;
  currentPageInformation?: { url?: string; analytics?: Record<string, unknown> };
  meta?: { url?: string; analytics?: Record<string, unknown> };
  [key: string]: unknown;
}

import type { SecurityAlertResponse as TCSecurityAlertResponse } from '@metamask/transaction-controller';

export type SecurityAlertResponse = TCSecurityAlertResponse;

export interface AnalyticsParams {
  account_type: string;
  dapp_host_name: string;
  chain_id: string | number | null | undefined;
  signature_type: string | undefined;
  version: string;
  [key: string]: unknown;
}

export const getAnalyticsParams = (
  messageParams: MessageParams,
  signType: string | undefined,
  securityAlertResponse?: SecurityAlertResponse,
): AnalyticsParams => {
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const { currentPageInformation = {}, meta = {} } = messageParams;
  const pageInfo = { ...currentPageInformation, ...meta };

  const analyticsParams: AnalyticsParams = {
    account_type: getAddressAccountType(messageParams.from as string),
    dapp_host_name: 'N/A',
    chain_id: null,
    signature_type: signType,
    version: messageParams?.version || 'N/A',
    ...(pageInfo.analytics || {}),
  };

  try {
    const chainId = selectEvmChainId(store.getState());
    analyticsParams.chain_id = getDecimalChainId(chainId);

    if (pageInfo.url) {
      const url = new URL(pageInfo.url);
      analyticsParams.dapp_host_name = url.host;
    }

    if (securityAlertResponse) {
      const blockaidParams = getBlockaidMetricsParams(securityAlertResponse);
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
  messageParams: MessageParams = { from: '' },
  confirmation = false,
  isError = false,
): void => {
  InteractionManager.runAfterInteractions(() => {
    /**
     * FIXME: need to rewrite the way BackgroundBridge sets the origin.
     */
    const origin = (messageParams.origin || '')
      .toLowerCase()
      .replace(/:/g, '');
    const isWCOrigin = origin.startsWith(
      WALLET_CONNECT_ORIGIN.replace(/:/g, '').toLowerCase(),
    );
    const isSDKOrigin = origin.startsWith(
      AppConstants.MM_SDK.SDK_REMOTE_ORIGIN.replace(/:/g, '').toLowerCase(),
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

export const handleSignatureAction = async (
  onAction: () => Promise<void> | void,
  messageParams: MessageParams,
  signType: string,
  securityAlertResponseOrConfirmation:
    | SecurityAlertResponse
    | boolean
    | undefined,
  confirmation?: boolean,
): Promise<void> => {
  let securityAlertResponse: SecurityAlertResponse | undefined;
  let confirmed: boolean;
  if (typeof securityAlertResponseOrConfirmation === 'boolean') {
    securityAlertResponse = undefined;
    confirmed = securityAlertResponseOrConfirmation;
  } else {
    securityAlertResponse = securityAlertResponseOrConfirmation;
    confirmed = confirmation ?? false;
  }
  await onAction();
  showWalletConnectNotification(messageParams, confirmed);
  MetaMetrics.getInstance().trackEvent(
    MetricsEventBuilder.createEventBuilder(
      confirmed
        ? MetaMetricsEvents.SIGNATURE_APPROVED
        : MetaMetricsEvents.SIGNATURE_REJECTED,
    )
      .addProperties(
        getAnalyticsParams(
          messageParams,
          signType,
          securityAlertResponse,
        ) as unknown as Parameters<
          ReturnType<typeof MetricsEventBuilder.createEventBuilder>['addProperties']
        >[0],
      )
      .build(),
  );
};

export const addSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: (...args: unknown[]) => void,
): void => {
  Engine.context.SignatureController.hub.on(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const removeSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: (...args: unknown[]) => void,
): void => {
  Engine.context.SignatureController.hub.removeListener(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const shouldTruncateMessage = (e: {
  nativeEvent: { layout: { height: number } };
}): boolean => {
  if (
    (Device.isIos() && e.nativeEvent.layout.height > 70) ||
    (Device.isAndroid() && e.nativeEvent.layout.height > 100)
  ) {
    return true;
  }

  return false;
};

import Engine from '../../core/Engine';
import { MetaMetrics, MetaMetricsEvents } from '../../core/Analytics';
import { getAddressAccountType } from '../address';
import NotificationManager from '../../core/NotificationManager';
import { WALLET_CONNECT_ORIGIN } from '../walletconnect';
import AppConstants from '../../core/AppConstants';
import { InteractionManager, type LayoutChangeEvent } from 'react-native';
import { strings } from '../../../locales/i18n';
import { selectEvmChainId } from '../../selectors/networkController';
import { store } from '../../store';
import { getBlockaidMetricsParams } from '../blockaid';
import Device from '../device';
import { getDecimalChainId } from '../networks';
import Logger from '../Logger';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';
import type { SecurityAlertResponse } from '@metamask/transaction-controller';
import type { JsonMap } from '../../core/Analytics/MetaMetrics.types';

interface SignatureMessageParams {
  from?: string;
  version?: string;
  origin?: string;
  currentPageInformation?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

interface WithReplaceAll {
  replaceAll(searchValue: string, replaceValue: string): string;
}

export const typedSign = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
};

export const getAnalyticsParams = (
  messageParams: SignatureMessageParams,
  signType: string,
  securityAlertResponse?: SecurityAlertResponse,
) => {
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const { currentPageInformation = {}, meta = {} } = messageParams;
  const pageInfo: Record<string, unknown> = {
    ...currentPageInformation,
    ...meta,
  };

  const analyticsParams: {
    account_type: string;
    dapp_host_name: string;
    chain_id: string | null;
    signature_type: string;
    version: string;
    [key: string]: unknown;
  } = {
    account_type: getAddressAccountType(messageParams.from as string),
    dapp_host_name: 'N/A',
    chain_id: null,
    signature_type: signType,
    version: (messageParams?.version as string) || 'N/A',
    ...(pageInfo.analytics as object),
  };

  try {
    const chainId = selectEvmChainId(store.getState());
    analyticsParams.chain_id = getDecimalChainId(chainId);

    if (pageInfo.url) {
      const url = new URL(pageInfo.url as string);
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
) => {
  if (isError) return strings('notifications.wc_signed_failed_title');
  return confirmation
    ? strings('notifications.wc_signed_title')
    : strings('notifications.wc_signed_rejected_title');
};

export const showWalletConnectNotification = (
  messageParams: SignatureMessageParams = {},
  confirmation = false,
  isError = false,
) => {
  InteractionManager.runAfterInteractions(() => {
    /**
     * FIXME: need to rewrite the way BackgroundBridge sets the origin.
     */
    const origin = (
      (messageParams.origin as string).toLowerCase() as unknown as WithReplaceAll
    ).replaceAll(':', '');
    const isWCOrigin = origin.startsWith(
      (WALLET_CONNECT_ORIGIN as unknown as WithReplaceAll)
        .replaceAll(':', '')
        .toLowerCase(),
    );
    const isSDKOrigin = origin.startsWith(
      (
        AppConstants.MM_SDK.SDK_REMOTE_ORIGIN as unknown as WithReplaceAll
      )
        .replaceAll(':', '')
        .toLowerCase(),
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
  messageParams: SignatureMessageParams,
  signType: string,
  securityAlertResponse: SecurityAlertResponse | undefined,
  confirmation: boolean = false,
) => {
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
          securityAlertResponse,
        ) as unknown as JsonMap,
      )
      .build(),
  );
};

export const addSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: (...args: unknown[]) => void,
) => {
  Engine.context.SignatureController.hub.on(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const removeSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: (...args: unknown[]) => void,
) => {
  Engine.context.SignatureController.hub.removeListener(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const shouldTruncateMessage = (e: LayoutChangeEvent) => {
  if (
    (Device.isIos() && e.nativeEvent.layout.height > 70) ||
    (Device.isAndroid() && e.nativeEvent.layout.height > 100)
  ) {
    return true;
  }

  return false;
};

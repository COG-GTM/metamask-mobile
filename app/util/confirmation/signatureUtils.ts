import Engine from '../../core/Engine';
import { MetaMetrics, MetaMetricsEvents } from '../../core/Analytics';
import { getAddressAccountType } from '../address';
import NotificationManager from '../../core/NotificationManager';
import { WALLET_CONNECT_ORIGIN } from '../walletconnect';
import AppConstants from '../../core/AppConstants';
import { InteractionManager, LayoutChangeEvent } from 'react-native';
import { strings } from '../../../locales/i18n';
import { selectEvmChainId } from '../../selectors/networkController';
import { store } from '../../store';
import { getBlockaidMetricsParams } from '../blockaid';
import Device from '../device';
import { getDecimalChainId } from '../networks';
import Logger from '../Logger';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';
import type { JsonMap } from '../../core/Analytics/MetaMetrics.types';

export const typedSign = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
};

interface PageInformation {
  url?: string;
  analytics?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SignatureMessageParams {
  from?: string;
  origin?: string;
  version?: string;
  currentPageInformation?: PageInformation;
  meta?: PageInformation;
  [key: string]: unknown;
}

interface SignatureAnalyticsParams extends JsonMap {
  account_type: string;
  dapp_host_name: string;
  chain_id: string | null;
  signature_type?: string;
  version: string;
}

// `String.prototype.replaceAll` is available at runtime (Hermes/JSC) but not in
// the `es2017` lib this project compiles against.
type StringWithReplaceAll = string & {
  replaceAll(searchValue: string, replaceValue: string): string;
};

export const getAnalyticsParams = (
  messageParams?: SignatureMessageParams,
  signType?: string,
  securityAlertResponse?:
    | Parameters<typeof getBlockaidMetricsParams>[0]
    | boolean,
) => {
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const { currentPageInformation = {}, meta = {} } = messageParams;
  const pageInfo = { ...currentPageInformation, ...meta };

  const analyticsParams: SignatureAnalyticsParams = {
    account_type: getAddressAccountType(messageParams.from as string),
    dapp_host_name: 'N/A',
    chain_id: null,
    signature_type: signType,
    version: messageParams?.version || 'N/A',
    ...pageInfo.analytics,
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
        securityAlertResponse as Parameters<typeof getBlockaidMetricsParams>[0],
      );
      Object.assign(analyticsParams, blockaidParams);
    }
  } catch (error) {
    Logger.error(error as Error, 'Error processing analytics parameters:');
  }

  return analyticsParams;
};

export const walletConnectNotificationTitle = (
  confirmation?: boolean,
  isError?: boolean,
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
      (messageParams.origin as string).toLowerCase() as StringWithReplaceAll
    ).replaceAll(':', '');
    const isWCOrigin = origin.startsWith(
      (WALLET_CONNECT_ORIGIN as StringWithReplaceAll)
        .replaceAll(':', '')
        .toLowerCase(),
    );
    const isSDKOrigin = origin.startsWith(
      (AppConstants.MM_SDK.SDK_REMOTE_ORIGIN as StringWithReplaceAll)
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
  onAction: () => void | Promise<void>,
  messageParams: SignatureMessageParams,
  signType?: string,
  securityAlertResponse?:
    | Parameters<typeof getBlockaidMetricsParams>[0]
    | boolean,
  confirmation?: boolean,
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
        getAnalyticsParams(messageParams, signType, securityAlertResponse),
      )
      .build(),
  );
};

export const addSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: (error: unknown) => void,
) => {
  Engine.context.SignatureController.hub.on(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const removeSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: (error: unknown) => void,
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

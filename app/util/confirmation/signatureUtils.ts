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

interface PageInformation {
  url?: string;
  origin?: string;
  // Analytics properties are dapp-provided and unstructured
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analytics?: Record<string, any>;
}

export interface SignatureMessageParams {
  from?: string;
  origin?: string;
  version?: string;
  currentPageInformation?: PageInformation;
  meta?: PageInformation;
}

interface SignatureAnalyticsParams {
  account_type: string;
  dapp_host_name: string;
  chain_id: string | null;
  signature_type: string;
  version: string;
  // Additional properties come from the dapp page info and Blockaid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// `replaceAll` is unavailable with the current `lib` setting
const stripColons = (value: string): string => value.split(':').join('');

export const typedSign = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
};

export const getAnalyticsParams = (
  messageParams: SignatureMessageParams,
  signType?: string,
  // The Blockaid response shape is owned by the security alerts feature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  securityAlertResponse?: any,
): SignatureAnalyticsParams => {
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const { currentPageInformation = {}, meta = {} } = messageParams;
  const pageInfo = { ...currentPageInformation, ...meta };

  const analyticsParams: SignatureAnalyticsParams = {
    account_type: getAddressAccountType(messageParams.from as string),
    dapp_host_name: 'N/A',
    chain_id: null,
    signature_type: signType as string,
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
  messageParams: SignatureMessageParams = {},
  confirmation = false,
  isError = false,
) => {
  InteractionManager.runAfterInteractions(() => {
    /**
     * FIXME: need to rewrite the way BackgroundBridge sets the origin.
     */
    const origin = stripColons(
      (messageParams.origin as string).toLowerCase(),
    );
    const isWCOrigin = origin.startsWith(
      stripColons(WALLET_CONNECT_ORIGIN).toLowerCase(),
    );
    const isSDKOrigin = origin.startsWith(
      stripColons(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN).toLowerCase(),
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
  // The Blockaid response shape is owned by the security alerts feature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  securityAlertResponse?: any,
  confirmation = false,
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

export const shouldTruncateMessage = (e: LayoutChangeEvent): boolean => {
  if (
    (Device.isIos() && e.nativeEvent.layout.height > 70) ||
    (Device.isAndroid() && e.nativeEvent.layout.height > 100)
  ) {
    return true;
  }

  return false;
};

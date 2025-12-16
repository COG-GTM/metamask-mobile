import { InteractionManager, LayoutChangeEvent } from 'react-native';
import type { SecurityAlertResponse } from '@metamask/transaction-controller';
import Engine from '../../core/Engine';
import { MetaMetrics, MetaMetricsEvents } from '../../core/Analytics';
import { getAddressAccountType } from '../address';
import NotificationManager from '../../core/NotificationManager';
import { WALLET_CONNECT_ORIGIN } from '../walletconnect';
import AppConstants from '../../core/AppConstants';
import { strings } from '../../../locales/i18n';
import { selectEvmChainId } from '../../selectors/networkController';
import { store } from '../../store';
import { getBlockaidMetricsParams } from '../blockaid';
import Device from '../device';
import { getDecimalChainId } from '../networks';
import Logger from '../Logger';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';
import { PageMeta } from '../../components/Views/confirmations/legacy/components/SignatureRequest/types';

export type { SecurityAlertResponse };

export interface SignatureMessageParams {
  data: string;
  from: string;
  metamaskId: string;
  meta?: PageMeta;
  origin: string;
  version?: string;
  currentPageInformation?: PageMeta;
}

export interface AnalyticsParams {
  account_type?: string;
  dapp_host_name: string;
  chain_id: string | null;
  signature_type: string;
  version: string;
  [key: string]: string | null | undefined;
}

export const typedSign: Record<string, string> = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
};

export const getAnalyticsParams = (
  messageParams: SignatureMessageParams | { currentPageInformation?: PageMeta; from?: string },
  signType: string,
  securityAlertResponse?: SecurityAlertResponse,
): AnalyticsParams => {
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const currentPageInformation = 'currentPageInformation' in messageParams 
    ? messageParams.currentPageInformation 
    : undefined;
  const meta = 'meta' in messageParams ? messageParams.meta : undefined;
  const pageInfo = { ...currentPageInformation, ...meta };

  const fromAddress = 'from' in messageParams ? messageParams.from : undefined;
  const analyticsParams: AnalyticsParams = {
    account_type: fromAddress ? getAddressAccountType(fromAddress) : undefined,
    dapp_host_name: 'N/A',
    chain_id: null,
    signature_type: signType,
    version: ('version' in messageParams ? messageParams.version : undefined) || 'N/A',
    ...pageInfo?.analytics,
  };

  try {
    const chainId = selectEvmChainId(store.getState());
    analyticsParams.chain_id = getDecimalChainId(chainId);

    if (pageInfo?.url) {
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
  messageParams: Pick<SignatureMessageParams, 'origin'> = { origin: '' },
  confirmation = false,
  isError = false,
): void => {
  InteractionManager.runAfterInteractions(() => {
    const origin = messageParams.origin?.toLowerCase().replace(/:/g, '') || '';
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
  messageParams: SignatureMessageParams,
  signType: string,
  securityAlertResponse?: SecurityAlertResponse,
  confirmation?: boolean,
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
        getAnalyticsParams(messageParams, signType, securityAlertResponse),
      )
      .build(),
  );
};

export const addSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: (params: { error: Error }) => void,
): void => {
  Engine.context.SignatureController.hub.on(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const removeSignatureErrorListener = (
  metamaskId: string,
  onSignatureError: (params: { error: Error }) => void,
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

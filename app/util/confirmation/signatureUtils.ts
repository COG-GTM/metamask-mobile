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

interface SignatureMessageParams {
  from: string;
  origin?: string;
  version?: string;
  currentPageInformation?: {
    url?: string;
    analytics?: Record<string, unknown>;
  } & Record<string, unknown>;
  meta?: {
    url?: string;
    analytics?: Record<string, unknown>;
  } & Record<string, unknown>;
  [key: string]: unknown;
}

interface AnalyticsParams {
  chain_id: string | number | null;
  dapp_host_name: string;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | string[]
    | undefined;
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
): AnalyticsParams => {
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const { currentPageInformation = {}, meta = {} } = messageParams;
  const pageInfo = { ...currentPageInformation, ...meta };

  const analyticsParams: AnalyticsParams = {
    account_type: getAddressAccountType(messageParams.from),
    dapp_host_name: 'N/A',
    chain_id: null,
    signature_type: signType,
    version: messageParams?.version || 'N/A',
    ...pageInfo.analytics,
  };

  try {
    const chainId = selectEvmChainId(store.getState());
    analyticsParams.chain_id = getDecimalChainId(chainId) ?? null;

    if (pageInfo.url) {
      const url = new URL(pageInfo.url);
      analyticsParams.dapp_host_name = url.host;
    }

    if (securityAlertResponse) {
      const blockaidParams = getBlockaidMetricsParams(securityAlertResponse);
      Object.assign(analyticsParams, blockaidParams);
    }
  } catch (error) {
    Logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'Error processing analytics parameters:',
    );
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
  messageParams: Partial<SignatureMessageParams> = {},
  confirmation = false,
  isError = false,
) => {
  InteractionManager.runAfterInteractions(() => {
    /**
     * FIXME: need to rewrite the way BackgroundBridge sets the origin.
     */
    const origin = (messageParams.origin as string)
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

export function handleSignatureAction(
  onAction: () => Promise<void> | void,
  messageParams: SignatureMessageParams,
  signType: string,
  confirmation?: boolean,
): Promise<void>;
export function handleSignatureAction(
  onAction: () => Promise<void> | void,
  messageParams: SignatureMessageParams,
  signType: string,
  securityAlertResponse?: SecurityAlertResponse,
  confirmation?: boolean,
): Promise<void>;
export async function handleSignatureAction(
  onAction: () => Promise<void> | void,
  messageParams: SignatureMessageParams,
  signType: string,
  securityAlertResponseOrConfirmation?: SecurityAlertResponse | boolean,
  confirmation?: boolean,
) {
  const securityAlertResponse =
    typeof securityAlertResponseOrConfirmation === 'boolean'
      ? undefined
      : securityAlertResponseOrConfirmation;
  confirmation =
    typeof securityAlertResponseOrConfirmation === 'boolean'
      ? securityAlertResponseOrConfirmation
      : confirmation;
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
        ) as unknown as Record<string, string | number | boolean | null>,
      )
      .build(),
  );
}

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

import { InteractionManager } from 'react-native';
import type { Hex } from '@metamask/utils';
import Engine from '../../core/Engine';
import NotificationManager from '../../core/NotificationManager';
import { strings } from '../../../locales/i18n';
import { MetaMetricsEvents } from '../../core/Analytics';
import AnalyticsV2 from '../../core/Analytics/AnalyticsV2';
import DevLogger from '../../core/SDKConnect/utils/DevLogger';
import Logger from '../Logger';
import {
  getAddressAccountType,
  isExternalHardwareAccount,
} from '../address';

export const typedSign = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
};

interface MessageParams {
  metamaskId?: string;
  from?: string;
  origin?: string;
  data?: string | Record<string, unknown>;
  version?: string;
}

interface SignatureRequest {
  messageParams?: MessageParams;
  type?: string;
}

interface AnalyticsParams {
  account_type?: string;
  dapp_host_name?: string;
  chain_id?: Hex;
  signature_type?: string;
  version?: string;
  [key: string]: string | Hex | undefined;
}

export function getAnalyticsParams(
  signatureRequest: SignatureRequest,
  chainId: Hex,
): AnalyticsParams {
  try {
    const { messageParams, type } = signatureRequest;
    const from = messageParams?.from;
    const origin = messageParams?.origin;

    const account_type = from ? getAddressAccountType(from) : undefined;
    const isExternalHW = from ? isExternalHardwareAccount(from) : false;

    return {
      account_type: isExternalHW ? 'hardware' : account_type,
      dapp_host_name: origin ?? undefined,
      chain_id: chainId,
      signature_type: type,
      version: messageParams?.version ?? undefined,
    };
  } catch (error) {
    return {};
  }
}

export function walletConnectNotificationTitle(confirmation: boolean): string {
  return confirmation
    ? strings('notifications.wc_signed_title')
    : strings('notifications.wc_signed_rejected_title');
}

export function showWalletConnectNotification(
  messageParams: MessageParams,
  confirmation: boolean,
): void {
  InteractionManager.runAfterInteractions(() => {
    messageParams?.origin &&
      (messageParams.origin.startsWith('wc') ||
        messageParams.origin.startsWith('sdk')) &&
      NotificationManager.showSimpleNotification({
        status: `simple_notification${!confirmation ? '_rejected' : ''}`,
        duration: 5000,
        title: walletConnectNotificationTitle(confirmation),
        description: strings('notifications.wc_description'),
      });
  });
}

let signatureListener: ((msg: string) => void) | null = null;

export function handleSignatureAction(
  onConfirm: () => void,
  onReject: () => void,
  signatureRequest: SignatureRequest,
  chainId: Hex,
  confirmation: boolean,
): void {
  const messageParams = signatureRequest.messageParams;
  if (confirmation) {
    onConfirm();
    AnalyticsV2.trackEvent(MetaMetricsEvents.SIGNATURE_APPROVED, getAnalyticsParams(signatureRequest, chainId));
  } else {
    onReject();
    AnalyticsV2.trackEvent(MetaMetricsEvents.SIGNATURE_REJECTED, getAnalyticsParams(signatureRequest, chainId));
  }
  showWalletConnectNotification(messageParams ?? {}, confirmation);
}

export function addSignatureErrorListener(callback: (msg: string) => void): void {
  signatureListener = callback;
  DevLogger.log('addSignatureErrorListener');
  Engine.context.SignatureController.hub.on(
    'SignatureController:signatureError',
    callback,
  );
}

export function removeSignatureErrorListener(): void {
  if (signatureListener) {
    Engine.context.SignatureController.hub.removeListener(
      'SignatureController:signatureError',
      signatureListener,
    );
    signatureListener = null;
  }
}

export function shouldTruncateMessage(message: string | Record<string, unknown>): boolean {
  try {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    return messageStr.length > 200;
  } catch (e) {
    Logger.error(e as Error, 'Error checking message length');
    return false;
  }
}

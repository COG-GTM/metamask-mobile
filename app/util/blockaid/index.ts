import type {
  SecurityAlertResponse,
  TransactionMeta,
} from '@metamask/transaction-controller';

import Engine from '../../core/Engine';
import { ResultType } from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';

interface TransactionSecurityAlertResponseType {
  securityAlertResponses: Record<string, SecurityAlertResponse>;
}

export type TransactionType = TransactionMeta &
  TransactionSecurityAlertResponseType;

/**
 * Minimal shape needed to look up a transaction's security alert response;
 * satisfied by both controller `TransactionMeta` and the redux transaction state.
 */
export type TransactionWithSecurityAlerts = Partial<
  Pick<TransactionType, 'id' | 'securityAlertResponses'>
>;

export const isBlockaidPreferenceEnabled = (): boolean => {
  const { PreferencesController } = Engine.context;
  return PreferencesController.state.securityAlertsEnabled;
};

export const isBlockaidFeatureEnabled = async (): Promise<boolean> =>
  isBlockaidPreferenceEnabled();

export const getBlockaidMetricsParams = (
  securityAlertResponse?: SecurityAlertResponse,
): Record<string, unknown> => {
  const additionalParams: Record<string, unknown> = {};

  if (securityAlertResponse) {
    const { result_type, reason, providerRequestsCount, source } =
      securityAlertResponse as SecurityAlertResponse & { source: string };

    additionalParams.security_alert_response = result_type;
    additionalParams.security_alert_reason = reason;
    additionalParams.security_alert_source = source;

    if (result_type === ResultType.Malicious) {
      additionalParams.ui_customizations = ['flagged_as_malicious'];
    } else if (result_type === ResultType.RequestInProgress) {
      additionalParams.ui_customizations = ['security_alert_loading'];
      additionalParams.security_alert_response = 'loading';
    }

    // add counts of each RPC call
    if (providerRequestsCount) {
      Object.keys(providerRequestsCount).forEach((key: string) => {
        const metricKey = `ppom_${key}_count`;
        additionalParams[metricKey] = providerRequestsCount[key];
      });
    }
  }

  return additionalParams;
};

export const getBlockaidTransactionMetricsParams = (
  transaction: TransactionWithSecurityAlerts | undefined,
): Record<string, unknown> => {
  let blockaidParams = {};

  if (!transaction) {
    return blockaidParams;
  }

  const { securityAlertResponses, id } = transaction;
  const securityAlertResponse = securityAlertResponses?.[id as string];
  if (securityAlertResponse) {
    blockaidParams = getBlockaidMetricsParams(securityAlertResponse);
  }

  return blockaidParams;
};




import { useCallback, useEffect, useMemo } from 'react';

import getDecimalChainId from '../../../../../util/networks/getDecimalChainId';
import { MetricsEventBuilder } from '../../../../../core/Analytics/MetricsEventBuilder';
import { MetaMetrics, MetaMetricsEvents } from '../../../../../core/Analytics';
import { getAddressAccountType } from '../../../../../util/address';
import { getBlockaidMetricsParams } from '../../../../../util/blockaid';
import { getHostFromUrl } from '../../utils/generic';
import { isSignatureRequest } from '../../utils/confirm';
import { getSignatureDecodingEventProps } from '../../utils/signature-metrics';
import { useSignatureRequest } from './useSignatureRequest';
import { useSecurityAlertResponse } from '../alerts/useSecurityAlertResponse';
import { useTypedSignSimulationEnabled } from './useTypedSignSimulationEnabled';
import { parseAndNormalizeSignTypedDataFromSignatureRequest } from '../../utils/signature';
import { useSelector } from 'react-redux';
import { selectConfirmationMetricsById } from '../../../../../core/redux/slices/confirmationMetrics';









const getAnalyticsParams = (
messageParams,
securityAlertResponse,
type,
chainId,
decodingData,
decodingLoading,
isSimulationEnabled,
primaryType,
confirmationMetrics) =>
{
  const { meta = {}, from, version } = messageParams;
  const { ui_customizations = [], ...blockaidProperties } = securityAlertResponse ? getBlockaidMetricsParams(securityAlertResponse) : {};

  return {
    account_type: getAddressAccountType(from),
    dapp_host_name: getHostFromUrl(meta.url) ?? 'N/A',
    signature_type: type,
    version: version || 'N/A',
    chain_id: chainId ? getDecimalChainId(chainId) : '',
    ui_customizations: ['redesigned_confirmation', ...ui_customizations],
    ...(primaryType ? { eip712_primary_type: primaryType } : {}),
    ...meta.analytics,
    ...getSignatureDecodingEventProps(
      decodingData,
      decodingLoading,
      isSimulationEnabled
    ),
    ...blockaidProperties,
    ...confirmationMetrics
  };
};

export const useSignatureMetrics = () => {
  const signatureRequest = useSignatureRequest();
  const isSimulationEnabled = useTypedSignSimulationEnabled();
  const { securityAlertResponse } = useSecurityAlertResponse();

  const { chainId, decodingData, decodingLoading, messageParams, type, id } =
  signatureRequest ?? {};
  const { primaryType } = parseAndNormalizeSignTypedDataFromSignatureRequest(signatureRequest);

  const confirmationMetrics = useSelector((state) =>
  selectConfirmationMetricsById(state, id ?? '')
  );

  const analyticsParams = useMemo(() => {
    if (!type || !isSignatureRequest(type)) {
      return;
    }
    return getAnalyticsParams(
      messageParams,
      securityAlertResponse,
      type,
      chainId,
      decodingData,
      !!decodingLoading,
      !!isSimulationEnabled,
      primaryType,
      confirmationMetrics?.properties ?? {}
    );
  }, [chainId, confirmationMetrics, decodingData, decodingLoading, isSimulationEnabled, messageParams, primaryType, securityAlertResponse, type]);

  const captureSignatureMetrics = useCallback(
    async (
    event) =>
    {
      if (!analyticsParams) {
        return;
      }

      MetaMetrics.getInstance().trackEvent(
        MetricsEventBuilder.createEventBuilder(event).
        addProperties(analyticsParams).
        build()
      );
    },
    [analyticsParams]
  );

  useEffect(() => {
    captureSignatureMetrics(MetaMetricsEvents.SIGNATURE_REQUESTED);
  }, [captureSignatureMetrics]);

  return { captureSignatureMetrics };
};
import React, { useEffect, useMemo } from 'react';
import { getDecimalChainId } from '../../../util/networks';
import PermissionSummary from '../PermissionsSummary';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { useNetworkInfo } from '../../../selectors/selectedNetworkController';
import { useMetrics } from '../../../components/hooks/useMetrics';
import type { PermissionsSummaryProps } from '../PermissionsSummary/PermissionsSummary.types';

/**
 * Account access approval component
 */
interface SwitchCustomNetworkProps {
  currentPageInformation: Omit<
    PermissionsSummaryProps['currentPageInformation'],
    'currentEnsName' | 'icon'
  > &
    Partial<
      Pick<PermissionsSummaryProps['currentPageInformation'], 'currentEnsName' | 'icon'>
    >;
  onConfirm?: () => void;
  onCancel?: () => void;
  customNetworkInformation: NonNullable<
    PermissionsSummaryProps['customNetworkInformation']
  >;
}

const SwitchCustomNetwork = ({
  customNetworkInformation,
  currentPageInformation,
  onCancel,
  onConfirm,
}: SwitchCustomNetworkProps) => {
  const { networkName } = useNetworkInfo(
    new URL(currentPageInformation.url).hostname,
  );
  const { trackEvent, createEventBuilder } = useMetrics();

  const trackingData = useMemo(
    () => ({
      chain_id: getDecimalChainId(customNetworkInformation.chainId),
      from_network: networkName,
      to_network: customNetworkInformation.chainName,
    }),
    [customNetworkInformation, networkName],
  );

  useEffect(() => {
    trackEvent(
      createEventBuilder(
        MetaMetricsEvents.NETWORK_SWITCH_REQUESTED_AND_MODAL_SHOWN,
      )
        .addProperties(trackingData)
        .build(),
    );
  }, [trackEvent, trackingData, createEventBuilder]);

  return (
    <PermissionSummary
      customNetworkInformation={customNetworkInformation}
      currentPageInformation={
        currentPageInformation as PermissionsSummaryProps['currentPageInformation']
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      isDisconnectAllShown={false}
      isNetworkSwitch
    />
  );
};

export default SwitchCustomNetwork as unknown as React.ComponentType<
  Record<string, unknown>
>;

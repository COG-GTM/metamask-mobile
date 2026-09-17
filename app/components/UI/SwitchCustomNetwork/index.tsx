import React, { useEffect, useMemo } from 'react';
import { getDecimalChainId } from '../../../util/networks';
import PermissionSummary from '../PermissionsSummary';
import { PermissionsSummaryProps } from '../PermissionsSummary/PermissionsSummary.types';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { useNetworkInfo } from '../../../selectors/selectedNetworkController';
import { useMetrics } from '../../../components/hooks/useMetrics';

interface SwitchCustomNetworkProps {
  /**
   * Object containing current page title, url, and icon href
   */
  currentPageInformation: PermissionsSummaryProps['currentPageInformation'];
  /**
   * Callback triggered on account access approval
   */
  onConfirm?: () => void;
  /**
   * Callback triggered on account access rejection
   */
  onCancel?: () => void;
  /**
   * Object containing info of the network to add
   */
  customNetworkInformation: NonNullable<
    PermissionsSummaryProps['customNetworkInformation']
  >;
}

/**
 * Account access approval component
 */
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
      currentPageInformation={currentPageInformation}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isDisconnectAllShown={false}
      isNetworkSwitch
    />
  );
};

export default SwitchCustomNetwork;

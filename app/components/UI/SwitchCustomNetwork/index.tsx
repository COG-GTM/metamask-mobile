import React, { useEffect, useMemo } from 'react';
import { getDecimalChainId } from '../../../util/networks';
import PermissionSummary from '../PermissionsSummary';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { useNetworkInfo } from '../../../selectors/selectedNetworkController';
import { useMetrics } from '../../../components/hooks/useMetrics';

interface CustomNetworkInformation {
  chainId: string;
  chainName?: string;
}

interface SwitchCustomNetworkProps {
  /**
   * Object containing current page title, url, and icon href
   */
  currentPageInformation: { url: string };
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
  customNetworkInformation: CustomNetworkInformation;
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
      customNetworkInformation={
        customNetworkInformation as { chainName: string; chainId: string }
      }
      currentPageInformation={
        currentPageInformation as {
          currentEnsName: string;
          icon: string | { uri: string };
          url: string;
        }
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      isDisconnectAllShown={false}
      isNetworkSwitch
    />
  );
};

export default SwitchCustomNetwork;

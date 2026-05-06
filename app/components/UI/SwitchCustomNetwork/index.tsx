import React, { useEffect, useMemo } from 'react';
import { getDecimalChainId } from '../../../util/networks';
import PermissionSummary from '../PermissionsSummary';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { useNetworkInfo } from '../../../selectors/selectedNetworkController';
import { useMetrics } from '../../../components/hooks/useMetrics';

interface CustomNetworkInformation {
  chainId: string;
  chainName: string;
  [key: string]: unknown;
}

interface PageInformation {
  url: string;
  currentEnsName?: string;
  icon?: string | { uri: string };
  [key: string]: unknown;
}

interface Props {
  customNetworkInformation: CustomNetworkInformation;
  currentPageInformation: PageInformation;
  onCancel?: () => void;
  onConfirm?: () => void;
}

/**
 * Account access approval component
 */
const SwitchCustomNetwork: React.FC<Props> = ({
  customNetworkInformation,
  currentPageInformation,
  onCancel,
  onConfirm,
}) => {
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
      currentPageInformation={currentPageInformation as { currentEnsName: string; icon: string | { uri: string }; url: string }}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isDisconnectAllShown={false}
      isNetworkSwitch
    />
  );
};

export default SwitchCustomNetwork;

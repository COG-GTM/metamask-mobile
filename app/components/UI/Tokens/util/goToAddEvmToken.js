





import { MetaMetricsEvents } from '../../../hooks/useMetrics';















export const goToAddEvmToken = ({
  setIsAddTokenEnabled,
  navigation,
  trackEvent,
  createEventBuilder,
  getDecimalChainId,
  currentChainId
}) => {
  setIsAddTokenEnabled(false);
  navigation.push('AddAsset', { assetType: 'token' });

  trackEvent(
    createEventBuilder(MetaMetricsEvents.TOKEN_IMPORT_CLICKED).
    addProperties({
      source: 'manual',
      chain_id: getDecimalChainId(currentChainId)
    }).
    build()
  );

  setIsAddTokenEnabled(true);
};
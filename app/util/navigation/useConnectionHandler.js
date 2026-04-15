import { useRef, useCallback } from 'react';
import {
  useMetrics,
  MetaMetricsEvents } from
'../../components/hooks/useMetrics';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useConnectionHandler = (navigation) => {
  const connectedRef = useRef(true);
  const timeoutRef = useRef(null);

  const { trackEvent, createEventBuilder } = useMetrics();

  const connectionChangeHandler = useCallback(
    (state) => {
      if (!state) return;
      const { isConnected } = state;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (connectedRef.current !== isConnected) {
        if (isConnected === false) {
          trackEvent(
            createEventBuilder(MetaMetricsEvents.CONNECTION_DROPPED).build()
          );
          timeoutRef.current = setTimeout(() => {
            navigation.navigate('OfflineModeView');
          }, 3000);
        } else {
          trackEvent(
            createEventBuilder(MetaMetricsEvents.CONNECTION_RESTORED).build()
          );
        }
        connectedRef.current = isConnected;
      }
    },
    [createEventBuilder, navigation, trackEvent]
  );

  return { connectionChangeHandler };
};
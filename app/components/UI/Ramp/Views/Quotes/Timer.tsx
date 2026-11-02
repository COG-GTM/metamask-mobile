import React, { useSyncExternalStore } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useStyles } from '../../../../hooks/useStyles';
import { useRampSDK } from '../../sdk';

import Text from '../../../../Base/Text';
import styleSheet from './Quotes.styles';
import { RemainingTimeStore } from './remainingTimeStore';

import { strings } from '../../../../../../locales/i18n';

const Timer = ({
  isFetchingQuotes,
  pollingCyclesLeft,
  remainingTime,
}: {
  isFetchingQuotes: boolean;
  pollingCyclesLeft: number;
  remainingTime: number;
}) => {
  const { appConfig } = useRampSDK();
  const { styles } = useStyles(styleSheet, {});

  return (
    <View style={styles.timerWrapper}>
      {isFetchingQuotes ? (
        <>
          <ActivityIndicator size="small" />
          <Text> {strings('fiat_on_ramp_aggregator.fetching_new_quotes')}</Text>
        </>
      ) : (
        <Text primary centered>
          {pollingCyclesLeft > 0
            ? strings('fiat_on_ramp_aggregator.new_quotes_in')
            : strings('fiat_on_ramp_aggregator.quotes_expire_in')}{' '}
          <Text
            bold
            primary
            style={[
              styles.timer,
              remainingTime <= appConfig.POLLING_INTERVAL_HIGHLIGHT &&
                styles.timerHiglight,
            ]}
          >
            {new Date(remainingTime).toISOString().substring(15, 19)}
          </Text>
        </Text>
      )}
    </View>
  );
};

export const LiveTimer = ({
  isFetchingQuotes,
  pollingCyclesLeft,
  remainingTimeStore,
}: {
  isFetchingQuotes: boolean;
  pollingCyclesLeft: number;
  remainingTimeStore: RemainingTimeStore;
}) => {
  const remainingTime = useSyncExternalStore(
    remainingTimeStore.subscribe,
    remainingTimeStore.get,
  );

  return (
    <Timer
      isFetchingQuotes={isFetchingQuotes}
      pollingCyclesLeft={pollingCyclesLeft}
      remainingTime={remainingTime}
    />
  );
};

export default Timer;

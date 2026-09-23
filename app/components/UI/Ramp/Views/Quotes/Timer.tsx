import React, { MutableRefObject, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useStyles } from '../../../../hooks/useStyles';
import { useRampSDK } from '../../sdk';

import Text from '../../../../Base/Text';
import styleSheet from './Quotes.styles';
import useInterval from '../../../../hooks/useInterval';

import { strings } from '../../../../../../locales/i18n';

export const TimerDisplay = ({
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

const Timer = ({
  isFetchingQuotes,
  pollingCyclesLeft,
  onTimerExpired,
  remainingTimeRef,
}: {
  isFetchingQuotes: boolean;
  pollingCyclesLeft: number;
  onTimerExpired: () => void;
  remainingTimeRef: MutableRefObject<number>;
}) => {
  const { appConfig } = useRampSDK();
  const [remainingTime, setRemainingTime] = useState(remainingTimeRef.current);

  const onTimerExpiredRef = useRef(onTimerExpired);
  onTimerExpiredRef.current = onTimerExpired;

  const tick = useCallback(() => {
    const newRemainingTime = remainingTimeRef.current - 1000;

    if (newRemainingTime > 0) {
      remainingTimeRef.current = newRemainingTime;
      setRemainingTime(newRemainingTime);
      return;
    }

    remainingTimeRef.current = appConfig.POLLING_INTERVAL;
    setRemainingTime(appConfig.POLLING_INTERVAL);
    onTimerExpiredRef.current();
  }, [appConfig.POLLING_INTERVAL, remainingTimeRef]);

  useInterval(tick, { delay: isFetchingQuotes ? null : 1000 });

  return (
    <TimerDisplay
      isFetchingQuotes={isFetchingQuotes}
      pollingCyclesLeft={pollingCyclesLeft}
      remainingTime={remainingTime}
    />
  );
};

export default Timer;

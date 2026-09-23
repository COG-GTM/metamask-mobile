import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useStyles } from '../../../../hooks/useStyles';
import { useRampSDK } from '../../sdk';
import useInterval from '../../../../hooks/useInterval';

import Text from '../../../../Base/Text';
import styleSheet from './Quotes.styles';

import { strings } from '../../../../../../locales/i18n';

const Timer = ({
  isFetchingQuotes,
  pollingCyclesLeft,
  expiresAt,
}: {
  isFetchingQuotes: boolean;
  pollingCyclesLeft: number;
  expiresAt: number;
}) => {
  const { appConfig } = useRampSDK();
  const { styles } = useStyles(styleSheet, {});

  const getRemainingTime = useCallback(() => {
    const remaining = Math.ceil((expiresAt - Date.now()) / 1000) * 1000;
    return remaining > 0 ? remaining : appConfig.POLLING_INTERVAL;
  }, [appConfig.POLLING_INTERVAL, expiresAt]);

  const [remainingTime, setRemainingTime] = useState(getRemainingTime);

  useEffect(() => {
    setRemainingTime(getRemainingTime());
  }, [getRemainingTime]);

  useInterval(() => setRemainingTime(getRemainingTime()), {
    delay: isFetchingQuotes ? null : 1000,
  });

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

export default Timer;

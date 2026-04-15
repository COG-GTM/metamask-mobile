/* eslint-disable react/prop-types */
import React from 'react';
import { StyleSheet } from 'react-native';
import { BigNumber } from 'bignumber.js';
import { useStyles } from '../../../hooks/useStyles';
import Text, {
  TextColor,
  TextVariant } from
'../../../../component-library/components/Texts/Text';
import { strings } from '../../../../../locales/i18n';
import useFiatFormatter from './useFiatFormatter';
import { FIAT_UNAVAILABLE } from '../types';
import useHideFiatForTestnet from '../../../hooks/useHideFiatForTestnet';
import { shortenString } from '../../../../util/notifications';

const styleSheet = () =>
StyleSheet.create({
  base: {
    paddingRight: 2,
    textAlign: 'right'
  }
});

const sharedTextProps = {
  color: TextColor.Alternative,
  variant: TextVariant.BodyMD
};

const FiatNotAvailableDisplay = () => {
  const { styles } = useStyles(styleSheet, {});
  return (
    <Text {...sharedTextProps} style={styles.base}>
      {strings('simulation_details.fiat_not_available')}
    </Text>);

};

export function calculateTotalFiat(fiatAmounts) {
  return fiatAmounts.reduce(
    (total, fiat) =>
    total.plus(
      fiat === FIAT_UNAVAILABLE ? new BigNumber(0) : new BigNumber(fiat)
    ),
    new BigNumber(0)
  );
}

/**
 * Displays the fiat value of a single balance change.
 *
 * @param props - Properties object.
 * @param props.fiatAmount - The fiat amount to display.
 */






export const IndividualFiatDisplay = ({
  fiatAmount,
  shorten = true
}) => {
  const hideFiatForTestnet = useHideFiatForTestnet();
  const { styles } = useStyles(styleSheet, {});
  const fiatFormatter = useFiatFormatter();

  if (hideFiatForTestnet) {
    return null;
  }

  if (fiatAmount === FIAT_UNAVAILABLE) {
    return <FiatNotAvailableDisplay />;
  }
  const absFiat = new BigNumber(fiatAmount).abs();

  const absFiatFormatted = shorten ?
  shortenString(fiatFormatter(absFiat), {
    truncatedCharLimit: 15,
    truncatedStartChars: 15,
    truncatedEndChars: 0,
    skipCharacterInEnd: true
  }) :
  fiatFormatter(absFiat);

  return (
    <Text {...sharedTextProps} style={styles.base}>
      {absFiatFormatted}
    </Text>);

};

/**
 * Displays the total fiat value of a list of balance changes.
 *
 * @param props - Properties object.
 * @param props.fiatAmounts - The list of fiat amounts to sum.
 */
export const TotalFiatDisplay =

({ fiatAmounts }) => {
  const hideFiatForTestnet = useHideFiatForTestnet();
  const { styles } = useStyles(styleSheet, {});
  const fiatFormatter = useFiatFormatter();
  const totalFiat = calculateTotalFiat(fiatAmounts);

  if (hideFiatForTestnet) {
    return null;
  }

  return totalFiat.eq(0) ?
  <FiatNotAvailableDisplay /> :

  <Text {...sharedTextProps} style={styles.base}>
      {strings('simulation_details.total_fiat', {
      currency: fiatFormatter(totalFiat.abs())
    })}
    </Text>;

};
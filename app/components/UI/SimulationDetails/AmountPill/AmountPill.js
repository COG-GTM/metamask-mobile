/* eslint-disable react/prop-types */
import React from 'react';

import { AssetType } from '../types';
import { formatAmount, formatAmountMaxPrecision } from '../formatAmount';
import I18n from '../../../../../locales/i18n';
import styleSheet from './AmountPill.styles';
import { View } from 'react-native';
import Text, {
  TextVariant } from
'../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../hooks/useStyles';
import { hexToDecimal } from '../../../../util/conversions';





/**
 * Displays a pill with an amount and a background color indicating whether the amount
 * is an increase or decrease.
 *
 * @param props
 * @param props.asset
 * @param props.amount
 */
const AmountPill = ({
  asset,
  amount,
  style,
  ...props
}) => {
  const { styles } = useStyles(styleSheet, {
    style,
    isNegative: amount.isNegative()
  });
  const amountParts = [amount.isNegative() ? '-' : '+'];
  const tooltipParts = [];

  // ERC721 amounts are always 1 and are not displayed.
  if (asset.type !== AssetType.ERC721) {
    const formattedAmount = formatAmount(I18n.locale, amount.abs());
    const fullPrecisionAmount = formatAmountMaxPrecision(
      I18n.locale,
      amount.abs()
    );

    amountParts.push(formattedAmount);
    tooltipParts.push(fullPrecisionAmount);
  }

  if (asset.tokenId) {
    const tokenIdPart = `#${hexToDecimal(asset.tokenId)}`;

    amountParts.push(tokenIdPart);
    tooltipParts.push(tokenIdPart);
  }

  return (
    <View
      testID="simulation-details-amount-pill"
      style={styles.base}
      {...props}>
      
      <Text
        ellipsizeMode="tail"
        variant={TextVariant.BodyMD}
        style={styles.label}>
        
        {amountParts.join(' ')}
      </Text>
    </View>);

};

export default AmountPill;
import React from 'react';
import Text, {
  TextColor,
  TextVariant } from
'../../../../component-library/components/Texts/Text';
import { View } from 'react-native';

const PercentageChange = ({ value }) => {
  const percentageColorText =
  value && value >= 0 ? TextColor.Success : TextColor.Error;

  const isValidAmount = (amount) =>
  amount !== null && amount !== undefined && !Number.isNaN(amount);

  const formattedValue = isValidAmount(value) ?
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` :
  '';

  return (
    <View>
      <Text color={percentageColorText} variant={TextVariant.BodyMDMedium}>
        {formattedValue}
      </Text>
    </View>);

};

export default PercentageChange;
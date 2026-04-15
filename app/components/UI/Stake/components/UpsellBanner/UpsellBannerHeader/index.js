import React from 'react';
import { View } from 'react-native';

import styleSheet from './UpsellBannerHeader.styles';
import { useStyles } from '../../../../../hooks/useStyles';
import Text, {
  TextVariant,
  TextColor } from
'../../../../../../component-library/components/Texts/Text';

const UpsellBannerHeader = ({
  primaryText,
  secondaryText,
  tertiaryText,
  endAccessory
}) => {
  const { styles } = useStyles(styleSheet, {});

  return (
    <View style={styles.container}>
      <Text variant={TextVariant.HeadingMD}>{primaryText}</Text>
      <Text variant={TextVariant.DisplayMD} color={TextColor.Success}>
        {secondaryText}
      </Text>
      <Text color={TextColor.Alternative}>{tertiaryText}</Text>
      {React.isValidElement(endAccessory) && endAccessory}
    </View>);

};

export default UpsellBannerHeader;
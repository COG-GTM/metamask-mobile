import React from 'react';
import { View, StyleSheet } from 'react-native';
import Box from './Box';
import { useTheme } from '../../../../util/theme';

import ListItem from '../../../../component-library/components/List/ListItem';
import ListItemColumn, {
  WidthType } from
'../../../../component-library/components/List/ListItemColumn';
import Text, {
  TextVariant } from
'../../../../component-library/components/Texts/Text';
import DownChevronText from './DownChevronText';
import RemoteImage from '../../../Base/RemoteImage';

const createStyles = (colors) =>
StyleSheet.create({
  chevron: {
    marginLeft: 10,
    color: colors.icon.default
  },
  icon: {
    width: 30,
    height: 20,
    marginRight: 6
  },
  iconContainer: {
    flexDirection: 'row',
    margin: 16
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.muted,
    marginLeft: 16,
    marginRight: 16
  }
});













const PaymentMethodSelector = ({
  name,
  icon,
  label,
  highlighted,
  onPress,
  paymentMethodIcons = []
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Box label={label} onPress={onPress} highlighted={highlighted} compact>
      <ListItem>
        {Boolean(icon) && <ListItemColumn>{icon}</ListItemColumn>}
        <ListItemColumn widthType={WidthType.Fill}>
          <Text
            variant={TextVariant.BodyLGMedium}
            numberOfLines={1}
            adjustsFontSizeToFit>
            
            {name}
          </Text>
        </ListItemColumn>
        <DownChevronText text="Change" />
      </ListItem>
      <View style={styles.divider} />
      <View style={styles.iconContainer}>
        {paymentMethodIcons.map((logoURL) =>
        <RemoteImage
          key={logoURL}
          source={{ uri: logoURL }}
          style={styles.icon} />

        )}
      </View>
    </Box>);

};

export default PaymentMethodSelector;
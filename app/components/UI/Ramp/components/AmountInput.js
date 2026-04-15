import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Box from './Box';
import DownChevronText from './DownChevronText';
import ListItem from '../../../../component-library/components/List/ListItem';
import ListItemColumn, {
  WidthType } from
'../../../../component-library/components/List/ListItemColumn';
import Text, {
  TextVariant,
  TextColor } from
'../../../../component-library/components/Texts/Text';
import { BuildQuoteSelectors } from '../../../../../e2e/selectors/Ramps/BuildQuote.selectors';

const styles = StyleSheet.create({
  amount: {
    fontSize: 24,
    lineHeight: 32
  },
  chevron: {
    flex: 0,
    marginLeft: 8
  }
});
















const AmountInput = ({
  label,
  currencySymbol,
  amount,
  currencyCode,
  highlighted,
  highlightedError,
  onPress,
  onCurrencyPress
}) =>
<Box label={label} highlighted={highlighted} compact>
    <ListItem>
      <ListItemColumn widthType={WidthType.Fill}>
        <TouchableOpacity
        accessible
        accessibilityRole="button"
        onPress={onPress}
        hitSlop={{ top: 20, left: 20, right: 20, bottom: 20 }}
        testID={BuildQuoteSelectors.AMOUNT_INPUT}>
        
          <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.amount}
          variant={TextVariant.BodyMDMedium}
          color={highlightedError ? TextColor.Error : TextColor.Default}>
          
            {currencySymbol || ''}
            {amount}
          </Text>
        </TouchableOpacity>
      </ListItemColumn>

      {onCurrencyPress ?
    <ListItemColumn style={styles.chevron}>
          <TouchableOpacity
        accessible
        accessibilityRole="button"
        disabled={!onCurrencyPress}
        onPress={onCurrencyPress}
        hitSlop={{ top: 20, left: 20, right: 20, bottom: 20 }}
        testID={BuildQuoteSelectors.SELECT_CURRENCY}>
        
            <DownChevronText text={currencyCode} />
          </TouchableOpacity>
        </ListItemColumn> :
    null}
    </ListItem>
  </Box>;


export default AmountInput;
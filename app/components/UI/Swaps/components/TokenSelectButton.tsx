/* eslint-disable @typescript-eslint/no-explicit-any */
interface TokenSelectButtonProps {
  disabled?: boolean;
  icon?: string;
  label?: string;
  onPress?: (...args: any[]) => any;
  symbol?: string;
}
import React from 'react';
import { View, StyleSheet } from 'react-native';

import SelectorButton from '../../../Base/SelectorButton';
import Text from '../../../Base/Text';
import TokenIcon from './TokenIcon';

const styles: any = StyleSheet.create({
  icon: {
    marginRight: 8,
  },
});

function TokenSelectButton({ icon, symbol, onPress, disabled, label }: TokenSelectButtonProps & any) {
  return (
    <SelectorButton onPress={onPress} disabled={disabled}>
      <View style={styles.icon}>
        <TokenIcon icon={icon} symbol={symbol} />
      </View>
      <Text primary>{symbol || label}</Text>
    </SelectorButton>
  );
}

export default TokenSelectButton;

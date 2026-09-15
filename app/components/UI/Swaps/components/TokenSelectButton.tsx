import React, { ComponentProps } from 'react';
import { View, StyleSheet, GestureResponderEvent } from 'react-native';

import SelectorButton from '../../../Base/SelectorButton';
import Text from '../../../Base/Text';
import TokenIcon from './TokenIcon';

const styles = StyleSheet.create({
  icon: {
    marginRight: 8,
  },
});

type SelectorButtonProps = ComponentProps<typeof SelectorButton>;

interface TokenSelectButtonProps {
  icon?: string;
  symbol?: string;
  label?: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

function TokenSelectButton({
  icon,
  symbol,
  onPress,
  disabled,
  label,
}: TokenSelectButtonProps) {
  // SelectorButton declares onPress as required; only forward it when given so
  // the rendered props are unchanged for callers that omit it.
  const pressProps = (onPress ? { onPress } : {}) as Pick<
    SelectorButtonProps,
    'onPress'
  >;
  return (
    <SelectorButton {...pressProps} disabled={disabled}>
      <View style={styles.icon}>
        <TokenIcon icon={icon} symbol={symbol} />
      </View>
      <Text primary>{symbol || label}</Text>
    </SelectorButton>
  );
}

export default TokenSelectButton;

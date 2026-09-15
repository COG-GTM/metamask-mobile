import React from 'react';
import { GestureResponderEvent, View, StyleSheet } from 'react-native';

import SelectorButton from '../../../Base/SelectorButton';
import Text from '../../../Base/Text';
import TokenIcon from './TokenIcon';

type OptionalSelectorButtonProps = Omit<
  React.ComponentProps<typeof SelectorButton>,
  'onPress'
> & {
  onPress?: (event: GestureResponderEvent) => void;
};

const OptionalSelectorButton =
  SelectorButton as React.ComponentType<OptionalSelectorButtonProps>;

interface TokenSelectButtonProps {
  icon?: string;
  symbol?: string;
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
}

const styles = StyleSheet.create({
  icon: {
    marginRight: 8,
  },
});

function TokenSelectButton({
  icon,
  symbol,
  onPress,
  disabled,
  label,
}: TokenSelectButtonProps) {
  return (
    <OptionalSelectorButton onPress={onPress} disabled={disabled}>
      <View style={styles.icon}>
        <TokenIcon icon={icon} symbol={symbol} />
      </View>
      <Text primary>{symbol || label}</Text>
    </OptionalSelectorButton>
  );
}

export default TokenSelectButton;

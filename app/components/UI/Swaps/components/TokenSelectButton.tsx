import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';

import SelectorButton from '../../../Base/SelectorButton';
import Text from '../../../Base/Text';
import TokenIcon from './TokenIcon';

const styles = StyleSheet.create({
  icon: {
    marginRight: 8,
  },
});

interface TokenSelectButtonProps {
  icon?: string;
  symbol?: string;
  onPress?: () => void;
  disabled?: boolean;
  label?: string;
}

function TokenSelectButton({
  icon,
  symbol,
  onPress,
  disabled,
  label,
}: TokenSelectButtonProps) {
  return (
    <SelectorButton
      // @ts-expect-error Preserve the legacy optional callback.
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.icon}>
        <TokenIcon icon={icon} symbol={symbol} />
      </View>
      <Text primary>{symbol || label}</Text>
    </SelectorButton>
  );
}

TokenSelectButton.propTypes = {
  icon: PropTypes.string,
  symbol: PropTypes.string,
  label: PropTypes.string,
  onPress: PropTypes.func,
  disabled: PropTypes.bool,
};

export default TokenSelectButton;

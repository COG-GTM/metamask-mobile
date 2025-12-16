import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { strings } from '../../../../../../../locales/i18n';
import Text from '../../../../../Base/Text';
import { useTheme } from '../../../../../../util/theme';
import { Theme } from '../../../../../../util/theme/models';

interface Styles {
  customNonce: ViewStyle;
  nonceNumber: TextStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    customNonce: {
      marginTop: 10,
      marginHorizontal: 24,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      display: 'flex',
      flexDirection: 'row',
    },
    nonceNumber: {
      marginLeft: 'auto',
    },
  });

interface CustomNonceProps {
  nonce?: number;
  onNonceEdit?: () => void;
}

const CustomNonce: React.FC<CustomNonceProps> = ({ nonce, onNonceEdit }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={styles.customNonce} onPress={onNonceEdit}>
      <Text bold black>
        {strings('transaction.custom_nonce')}
      </Text>
      <Text bold link>
        {'  '}
        {strings('transaction.edit')}
      </Text>
      <Text bold black style={styles.nonceNumber}>
        {nonce}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomNonce;

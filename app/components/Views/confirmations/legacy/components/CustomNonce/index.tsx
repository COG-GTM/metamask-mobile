/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { strings } from '../../../../../../../locales/i18n';
import Text from '../../../../../Base/Text';
import { useTheme } from '../../../../../../util/theme';

const createStyles = (colors) =>
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

const CustomNonce = ({ nonce, onNonceEdit }): CustomNonceProps & any => {
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

interface CustomNonceProps {
  nonce?: number;
  onNonceEdit?: (...args: any[]) => any;
}
type Props = CustomNonceProps & any;

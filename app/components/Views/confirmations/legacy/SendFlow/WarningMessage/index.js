import React from 'react';
import { StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Alert, { AlertType } from '../../../../../Base/Alert';
import { useTheme } from '../../../../../../util/theme';










const styles = StyleSheet.create({
  icon: {
    paddingTop: 4,
    paddingRight: 8
  }
});

const WarningMessage = ({ warningMessage, style, onDismiss }) => {
  const { colors } = useTheme();

  return (
    <Alert
      type={AlertType.Warning}
      style={style}
      onDismiss={onDismiss}
      renderIcon={() =>
      <FontAwesome
        style={styles.icon}
        name={'exclamation-circle'}
        color={colors.warning.default}
        size={18} />

      }>
      
      {warningMessage}
    </Alert>);

};

export default WarningMessage;
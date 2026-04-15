
import { StyleSheet } from 'react-native';

const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    buttonLabel: {
      color: colors.primary.default,
      paddingTop: 8,
      textAlign: 'center'
    },

    disclaimer: {
      paddingTop: 16
    }
  });
};

export default styleSheet;
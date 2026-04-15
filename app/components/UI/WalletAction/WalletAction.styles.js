// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


/**
 * Style sheet function for WalletAction component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    base: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingVertical: 16
    },
    descriptionLabel: {
      color: colors.text.alternative
    },
    disabled: {
      opacity: 0.5
    }
  });
};

export default styleSheet;
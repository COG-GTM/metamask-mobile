// Third party dependencies.
import { StyleSheet } from 'react-native';

import { fontStyles } from '../../../styles/common';

/**
 * Style sheet function for ModalConfirmation component.
 *
 * @param params Style sheet params.
 * @param params.theme App theme from ThemeContext.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;
  return StyleSheet.create({
    container: {},
    fromTextContainer: {
      marginHorizontal: 8,
      marginVertical: 8
    },
    fromText: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 16
    },
    iconContainer: {
      marginRight: 8
    },
    domainUrl: {
      ...fontStyles.bold,
      textAlign: 'center',
      fontSize: 14,
      color: colors.text.default
    }
  });
};

export default styleSheet;
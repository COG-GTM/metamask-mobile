// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.


/**
 * Style sheet function for FoxLoader component.
 *
 * @param params Style sheet params.
 * @returns StyleSheet object.
 */
const styleSheet = (params) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      backgroundColor: colors.background.default,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    image: {
      width: 72,
      height: 72
    },
    spacer: {
      marginVertical: 16
    }
  });
};

export default styleSheet;